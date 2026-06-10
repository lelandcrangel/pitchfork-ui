import { forwardRef, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { Badge } from '../Badge';
import { Icon, type IconName } from '../Icon';
import './Tabs.css';

// Avoid SSR warnings: useLayoutEffect on the client, useEffect on the server.
const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

interface IndicatorRect {
  left: number;
  width: number;
  top: number;
  height: number;
}

export interface TabsItem {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  /** Decorative icon rendered alongside the label (e.g. `"code"` next to "Code"). */
  icon?: IconName;
  /** Which side of the label the icon sits on. Defaults to `"start"`. */
  iconPlacement?: 'start' | 'end';
  /**
   * Numeric count rendered as a small badge beside the label (GitHub-style,
   * e.g. "Issues 12"). The number is part of the tab's accessible name, so
   * screen readers announce "Issues, 12". Pass `0` to show a zero count;
   * omit the prop to hide the badge entirely.
   */
  count?: number;
  /** Which side of the label the count badge sits on. Defaults to `"end"`. */
  badgePlacement?: 'start' | 'end';
}

export type TabsVariant = 'underline' | 'pills';
export type TabsSize = 'sm' | 'md';

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabsItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  fullWidth?: boolean;
}

function getFirstEnabledValue(items: TabsItem[]): string | undefined {
  return items.find((item) => !item.disabled)?.value;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    className,
    items,
    value,
    defaultValue,
    onValueChange,
    variant = 'underline',
    size = 'md',
    fullWidth = false,
    ...props
  },
  ref,
) {
  const baseId = useId();
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(
    defaultValue ?? getFirstEnabledValue(items),
  );
  const selectedValue = isControlled ? value : internalValue;
  const selectedItem = useMemo(
    () =>
      items.find((item) => item.value === selectedValue && !item.disabled) ??
      items.find((item) => !item.disabled),
    [items, selectedValue],
  );
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  // Measure the active tab so a single shared indicator can slide between tabs.
  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    const activeIndex = items.findIndex((item) => item.value === selectedItem?.value);
    const activeButton = buttonRefs.current[activeIndex];
    if (!list || !activeButton) {
      setIndicator(null);
      return;
    }
    // offsetLeft/Top are relative to the positioned list and scroll-invariant,
    // so the indicator (an abs-positioned child) tracks the tab whether or not
    // the strip is scrolled — no manual scrollLeft math or rect subtraction.
    const measure = () => {
      setIndicator({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
        top: activeButton.offsetTop,
        height: activeButton.offsetHeight,
      });
    };
    measure();

    // Re-measure once web fonts load: sibling tabs can change width and shift
    // the active tab without resizing it, which a ResizeObserver alone misses.
    let cancelled = false;
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
    fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        cancelled = true;
      };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(activeButton);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [items, selectedItem?.value, variant, size, fullWidth]);

  const setSelectedValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const enabledIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.disabled)
    .map(({ index }) => index);

  const moveSelection = (
    currentIndex: number,
    direction: 'next' | 'previous' | 'first' | 'last',
  ) => {
    if (enabledIndexes.length === 0) {
      return;
    }

    const targetIndex =
      direction === 'first'
        ? (enabledIndexes[0] ?? currentIndex)
        : direction === 'last'
          ? (enabledIndexes[enabledIndexes.length - 1] ?? currentIndex)
          : (() => {
              const currentEnabledPosition = enabledIndexes.indexOf(currentIndex);
              const fallbackPosition = direction === 'next' ? 0 : enabledIndexes.length - 1;
              const safePosition =
                currentEnabledPosition === -1 ? fallbackPosition : currentEnabledPosition;
              const offset = direction === 'next' ? 1 : -1;
              const wrappedPosition =
                (safePosition + offset + enabledIndexes.length) % enabledIndexes.length;
              return enabledIndexes[wrappedPosition] ?? currentIndex;
            })();

    const nextItem = items[targetIndex];
    if (!nextItem || nextItem.disabled) {
      return;
    }

    setSelectedValue(nextItem.value);
    buttonRefs.current[targetIndex]?.focus();
  };

  return (
    <div ref={ref} className={cx('pf-tabs', className)} {...props}>
      <div
        ref={listRef}
        className={cx(
          'pf-tabs__list',
          `pf-tabs__list--${variant}`,
          `pf-tabs__list--${size}`,
          fullWidth && 'pf-tabs__list--full-width',
        )}
        role="tablist"
        aria-orientation="horizontal"
      >
        {indicator ? (
          <span
            aria-hidden
            className={cx('pf-tabs__indicator', `pf-tabs__indicator--${variant}`)}
            style={
              variant === 'pills'
                ? {
                    left: indicator.left,
                    width: indicator.width,
                    top: indicator.top,
                    height: indicator.height,
                  }
                : { left: indicator.left, width: indicator.width }
            }
          />
        ) : null}
        {items.map((item, index) => {
          const isSelected = item.value === selectedItem?.value;
          const tabId = `${baseId}-tab-${item.value}`;
          const panelId = `${baseId}-panel-${item.value}`;

          const iconPlacement = item.iconPlacement ?? 'start';
          const badgePlacement = item.badgePlacement ?? 'end';
          // Decorative: the label carries the accessible name.
          const iconNode = item.icon ? (
            <Icon key="icon" name={item.icon} className="pf-tabs__tab-icon" aria-hidden />
          ) : null;
          // The count text is intentionally left in the accessible name so
          // screen readers announce e.g. "Issues, 12".
          const countNode =
            item.count !== undefined ? (
              <Badge key="count" className="pf-tabs__tab-count" variant="neutral">
                {item.count}
              </Badge>
            ) : null;

          return (
            <button
              key={item.value}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              id={tabId}
              type="button"
              role="tab"
              className={cx(
                'pf-tabs__tab',
                `pf-tabs__tab--${variant}`,
                `pf-tabs__tab--${size}`,
                isSelected && 'pf-tabs__tab--active',
              )}
              aria-controls={panelId}
              aria-selected={isSelected}
              tabIndex={item.disabled ? -1 : 0}
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  setSelectedValue(item.value);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  moveSelection(index, 'next');
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  moveSelection(index, 'previous');
                } else if (event.key === 'Home') {
                  event.preventDefault();
                  moveSelection(index, 'first');
                } else if (event.key === 'End') {
                  event.preventDefault();
                  moveSelection(index, 'last');
                } else if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (!item.disabled) {
                    setSelectedValue(item.value);
                  }
                }
              }}
            >
              {iconPlacement === 'start' ? iconNode : null}
              {badgePlacement === 'start' ? countNode : null}
              <span className="pf-tabs__tab-label">{item.label}</span>
              {badgePlacement === 'end' ? countNode : null}
              {iconPlacement === 'end' ? iconNode : null}
            </button>
          );
        })}
      </div>

      {selectedItem ? (
        <div
          id={`${baseId}-panel-${selectedItem.value}`}
          className="pf-tabs__panel"
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${selectedItem.value}`}
          tabIndex={0}
        >
          {selectedItem.content}
        </div>
      ) : null}
    </div>
  );
});

Tabs.displayName = 'Tabs';
