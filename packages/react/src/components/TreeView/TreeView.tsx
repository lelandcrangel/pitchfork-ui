import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
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

export interface TreeViewProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSelect'
> {
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

interface FlattenedTreeNode {
  node: TreeViewNode;
  level: number;
  parentValue?: string;
}

function flattenVisibleNodes(
  nodes: TreeViewNode[],
  expandedSet: Set<string>,
  level = 1,
  parentValue?: string,
): FlattenedTreeNode[] {
  const flattened: FlattenedTreeNode[] = [];

  for (const node of nodes) {
    flattened.push({ node, level, parentValue });

    if (
      node.children &&
      node.children.length > 0 &&
      expandedSet.has(node.value)
    ) {
      flattened.push(
        ...flattenVisibleNodes(
          node.children,
          expandedSet,
          level + 1,
          node.value,
        ),
      );
    }
  }

  return flattened;
}

function findFirstEnabledValue(nodes: TreeViewNode[]): string | undefined {
  for (const node of nodes) {
    if (!node.disabled) {
      return node.value;
    }

    if (node.children && node.children.length > 0) {
      const childValue = findFirstEnabledValue(node.children);
      if (childValue) {
        return childValue;
      }
    }
  }

  return undefined;
}

function collectExpandableNodeValues(nodes: TreeViewNode[]): string[] {
  const values: string[] = [];

  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      values.push(node.value);
      values.push(...collectExpandableNodeValues(node.children));
    }
  }

  return values;
}

export const TreeView = forwardRef<TreeViewHandle, TreeViewProps>(
  function TreeView(
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

    const [internalSelectedValue, setInternalSelectedValue] = useState<
      string | undefined
    >(defaultSelectedValue ?? findFirstEnabledValue(nodes));
    const [internalExpandedValues, setInternalExpandedValues] = useState<
      string[]
    >(defaultExpandedValues);

    const resolvedSelectedValue = isSelectedControlled
      ? selectedValue
      : internalSelectedValue;
    const resolvedExpandedValues = isExpandedControlled
      ? expandedValues
      : internalExpandedValues;

    const expandedSet = useMemo(
      () => new Set(resolvedExpandedValues),
      [resolvedExpandedValues],
    );

    const flattenedNodes = useMemo(
      () => flattenVisibleNodes(nodes, expandedSet),
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
      updateExpandedValues(collectExpandableNodeValues(nodes));
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

    const onItemKeyDown = (
      current: FlattenedTreeNode,
      event: React.KeyboardEvent,
    ) => {
      const currentIndex = flattenedNodes.findIndex(
        (item) => item.node.value === current.node.value,
      );

      if (currentIndex === -1) {
        return;
      }

      const hasChildren = !!(
        current.node.children && current.node.children.length > 0
      );
      const isExpanded = expandedSet.has(current.node.value);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusNodeByValue(flattenedNodes[currentIndex + 1]?.node.value);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusNodeByValue(flattenedNodes[currentIndex - 1]?.node.value);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (hasChildren && !isExpanded) {
          setExpandedState(current.node.value, true);
          return;
        }
        if (hasChildren && isExpanded) {
          const nextNode = flattenedNodes[currentIndex + 1];
          if (nextNode && nextNode.parentValue === current.node.value) {
            focusNodeByValue(nextNode.node.value);
          }
        }
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (hasChildren && isExpanded) {
          setExpandedState(current.node.value, false);
          return;
        }
        focusNodeByValue(current.parentValue);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        focusNodeByValue(flattenedNodes[0]?.node.value);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        focusNodeByValue(flattenedNodes[flattenedNodes.length - 1]?.node.value);
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!current.node.disabled) {
          setSelectedValue(current.node.value);
        }
        if (hasChildren) {
          toggleExpanded(current.node.value);
        }
      }
    };

    return (
      <div className={cx('pf-tree-view', className)} role="tree" {...props}>
        <ul className="pf-tree-view__list" role="presentation">
          {flattenedNodes.map((item) => {
            const hasChildren = !!(
              item.node.children && item.node.children.length > 0
            );
            const isExpanded = expandedSet.has(item.node.value);
            const isSelected = resolvedSelectedValue === item.node.value;

            return (
              <li
                key={item.node.value}
                className="pf-tree-view__item"
                role="presentation"
              >
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
                      <span className="pf-tree-view__icon">
                        {item.node.icon}
                      </span>
                    ) : null}
                    <span className="pf-tree-view__label">
                      {item.node.label}
                    </span>
                    {item.node.badge ? (
                      <span className="pf-tree-view__badge">
                        {item.node.badge}
                      </span>
                    ) : null}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

TreeView.displayName = 'TreeView';
