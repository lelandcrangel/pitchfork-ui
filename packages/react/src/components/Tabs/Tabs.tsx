import { useId, useMemo, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import './Tabs.css';

export interface TabsItem {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export type TabsVariant = 'underline' | 'pills';
export type TabsSize = 'sm' | 'md';

export interface TabsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
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

export function Tabs({
  className,
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  ...props
}: TabsProps) {
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

    let targetIndex = currentIndex;

    if (direction === 'first') {
      targetIndex = enabledIndexes[0] ?? currentIndex;
    } else if (direction === 'last') {
      targetIndex = enabledIndexes[enabledIndexes.length - 1] ?? currentIndex;
    } else {
      const currentEnabledPosition = enabledIndexes.indexOf(currentIndex);
      const fallbackPosition =
        direction === 'next' ? 0 : enabledIndexes.length - 1;
      const safePosition =
        currentEnabledPosition === -1
          ? fallbackPosition
          : currentEnabledPosition;
      const offset = direction === 'next' ? 1 : -1;
      const wrappedPosition =
        (safePosition + offset + enabledIndexes.length) % enabledIndexes.length;
      targetIndex = enabledIndexes[wrappedPosition] ?? currentIndex;
    }

    const nextItem = items[targetIndex];
    if (!nextItem || nextItem.disabled) {
      return;
    }

    setSelectedValue(nextItem.value);
    buttonRefs.current[targetIndex]?.focus();
  };

  return (
    <div className={cx('pf-tabs', className)} {...props}>
      <div
        className={cx(
          'pf-tabs__list',
          `pf-tabs__list--${variant}`,
          `pf-tabs__list--${size}`,
          fullWidth && 'pf-tabs__list--full-width',
        )}
        role="tablist"
        aria-orientation="horizontal"
      >
        {items.map((item, index) => {
          const isSelected = item.value === selectedItem?.value;
          const tabId = `${baseId}-tab-${item.value}`;
          const panelId = `${baseId}-panel-${item.value}`;

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
              {item.label}
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
}

Tabs.displayName = 'Tabs';
