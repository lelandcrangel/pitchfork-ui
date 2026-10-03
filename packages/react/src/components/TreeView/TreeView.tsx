import {
  expandableTreeValues,
  firstEnabledTreeValue,
  type FlatTreeNode,
  flattenVisibleTree,
  resolveTreeKey,
} from '@pitchfork-ui/core';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import './TreeView.css';

export interface TreeViewNode {
  value: string;
  label: React.ReactNode;
  children?: TreeViewNode[];
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface TreeViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  nodes: TreeViewNode[];
  selectedValue?: string;
  defaultSelectedValue?: string;
  onSelectedValueChange?: (value: string) => void;
  expandedValues?: string[];
  defaultExpandedValues?: string[];
  onExpandedValuesChange?: (values: string[]) => void;
}

export interface TreeViewHandle {
  expandAll: () => void;
  collapseAll: () => void;
}

export const TreeView = forwardRef<TreeViewHandle, TreeViewProps>(function TreeView(
  {
    className,
    nodes,
    selectedValue,
    defaultSelectedValue,
    onSelectedValueChange,
    expandedValues,
    defaultExpandedValues = [],
    onExpandedValuesChange,
    ...props
  }: TreeViewProps,
  ref,
) {
  const isSelectedControlled = selectedValue !== undefined;
  const isExpandedControlled = expandedValues !== undefined;

  const [internalSelectedValue, setInternalSelectedValue] = useState<string | undefined>(
    defaultSelectedValue ?? firstEnabledTreeValue(nodes),
  );
  const [internalExpandedValues, setInternalExpandedValues] =
    useState<string[]>(defaultExpandedValues);

  const resolvedSelectedValue = isSelectedControlled ? selectedValue : internalSelectedValue;
  const resolvedExpandedValues = isExpandedControlled ? expandedValues : internalExpandedValues;

  const expandedSet = useMemo(() => new Set(resolvedExpandedValues), [resolvedExpandedValues]);

  /*
   * The visible list, the keyboard rules and the "expand all" sweep are all
   * core's, so `<pf-tree-view>` walks the same tree the same way — including
   * the two horizontal rules, which are the ARIA pattern rather than anything
   * either layer should decide for itself.
   */
  const flattenedNodes = useMemo(
    () => flattenVisibleTree(nodes, expandedSet),
    [expandedSet, nodes],
  );

  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const updateExpandedValues = useCallback(
    (nextValues: string[]) => {
      if (!isExpandedControlled) {
        setInternalExpandedValues(nextValues);
      }
      onExpandedValuesChange?.(nextValues);
    },
    [isExpandedControlled, onExpandedValuesChange],
  );

  const expandAll = useCallback(() => {
    updateExpandedValues(expandableTreeValues(nodes));
  }, [nodes, updateExpandedValues]);

  const collapseAll = useCallback(() => {
    updateExpandedValues([]);
  }, [updateExpandedValues]);

  useImperativeHandle(
    ref,
    () => ({
      expandAll,
      collapseAll,
    }),
    [collapseAll, expandAll],
  );

  const setExpandedState = (value: string, expanded: boolean) => {
    const nextSet = new Set(resolvedExpandedValues);

    if (expanded) {
      nextSet.add(value);
    } else {
      nextSet.delete(value);
    }

    updateExpandedValues(Array.from(nextSet));
  };

  const toggleExpanded = (value: string) => {
    setExpandedState(value, !expandedSet.has(value));
  };

  const setSelectedValue = (value: string) => {
    if (!isSelectedControlled) {
      setInternalSelectedValue(value);
    }
    onSelectedValueChange?.(value);
  };

  const focusNodeByValue = (value?: string) => {
    if (!value) {
      return;
    }
    itemRefs.current[value]?.focus();
  };

  /*
   * Core decides what the key means; this only carries the intent out. The
   * keys it does not claim are left to the browser, which is what `null`
   * means.
   */
  const onItemKeyDown = (current: FlatTreeNode<TreeViewNode>, event: React.KeyboardEvent) => {
    const currentIndex = flattenedNodes.findIndex((item) => item.node.value === current.node.value);
    const intent = resolveTreeKey(event.key, flattenedNodes, currentIndex);
    if (!intent) {
      return;
    }

    event.preventDefault();

    if (intent.type === 'focus') {
      focusNodeByValue(intent.value);
      return;
    }
    if (intent.type === 'expand' || intent.type === 'collapse') {
      setExpandedState(intent.value, intent.type === 'expand');
      return;
    }

    // Activation both selects and toggles, as a click on each half would.
    if (!current.node.disabled) {
      setSelectedValue(intent.value);
    }
    if (current.hasChildren) {
      toggleExpanded(intent.value);
    }
  };

  return (
    <div className={cx('pf-tree-view', className)} role="tree" {...props}>
      <ul className="pf-tree-view__list" role="presentation">
        {flattenedNodes.map((item) => {
          const { hasChildren, expanded: isExpanded } = item;
          const isSelected = resolvedSelectedValue === item.node.value;

          return (
            <li key={item.node.value} className="pf-tree-view__item" role="presentation">
              <div
                className={cx(
                  'pf-tree-view__row',
                  isSelected && 'pf-tree-view__row--selected',
                  item.node.disabled && 'pf-tree-view__row--disabled',
                )}
                style={
                  {
                    '--pf-tree-level': String(item.level - 1),
                  } as React.CSSProperties
                }
              >
                <span className="pf-tree-view__toggle-wrap" aria-hidden>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="pf-tree-view__toggle"
                      onClick={() => toggleExpanded(item.node.value)}
                      tabIndex={-1}
                    >
                      {isExpanded ? '▾' : '▸'}
                    </button>
                  ) : (
                    <span className="pf-tree-view__spacer" />
                  )}
                </span>

                <button
                  ref={(element) => {
                    itemRefs.current[item.node.value] = element;
                  }}
                  type="button"
                  role="treeitem"
                  className="pf-tree-view__node"
                  aria-level={item.level}
                  aria-expanded={hasChildren ? isExpanded : undefined}
                  aria-selected={isSelected}
                  disabled={item.node.disabled}
                  onClick={() => {
                    if (!item.node.disabled) {
                      setSelectedValue(item.node.value);
                    }
                  }}
                  onKeyDown={(event) => onItemKeyDown(item, event)}
                >
                  {item.node.icon ? (
                    <span className="pf-tree-view__icon">{item.node.icon}</span>
                  ) : null}
                  <span className="pf-tree-view__label">{item.node.label}</span>
                  {item.node.badge ? (
                    <span className="pf-tree-view__badge">{item.node.badge}</span>
                  ) : null}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

TreeView.displayName = 'TreeView';
