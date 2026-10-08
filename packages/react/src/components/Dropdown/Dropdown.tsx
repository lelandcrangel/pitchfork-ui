import { createPortal } from 'react-dom';
import { forwardRef, useEffect, useId, useRef } from 'react';
import { resolveRovingKey } from '@pitchfork-ui/core';
import { isActivationKey, Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useDisclosure,
  useListNavigation,
  useOutsideInteraction,
} from '../../hooks';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Dropdown.css';

export interface DropdownItem {
  id?: string;
  label: string;
  onSelect?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  items: DropdownItem[];
  align?: 'start' | 'end';
  disabled?: boolean;
  /**
   * Maximum number of items to show before scrolling. If not set, menu grows to fit all items.
   */
  maxVisibleItems?: number;
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    { label = 'Actions', items, align = 'start', disabled, className, maxVisibleItems, ...props },
    ref,
  ) => {
    const menuId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const disclosure = useDisclosure({ disabled });
    const { isOpen } = disclosure;
    const { activeIndex, move, setActiveIndex } = useListNavigation({
      items,
      isDisabled: (item) => Boolean(item.disabled),
    });
    const menuStyle = useAnchoredPosition({
      anchorRef: triggerRef,
      align,
      enabled: isOpen,
      matchAnchorWidth: false,
      minWidth: 200,
    });

    useOutsideInteraction({
      refs: [rootRef, menuRef],
      enabled: isOpen,
      onInteractOutside: disclosure.close,
    });

    // Move focus to the first enabled menu item when the menu opens.
    // No RAF needed — portal is mounted in the same render cycle, menuRef is available.
    useEffect(() => {
      if (!isOpen) return;
      const first = menuRef.current?.querySelector<HTMLButtonElement>(
        '[role="menuitem"]:not([disabled])',
      );
      first?.focus();
    }, [isOpen]);

    const onTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
      if (disabled) return;
      if (event.key === Keys.ArrowDown || event.key === Keys.ArrowUp) {
        event.preventDefault();
        if (!isOpen) disclosure.open();
        return;
      }
      if (event.key === Keys.Escape && isOpen) {
        disclosure.close();
        return;
      }
      if (isActivationKey(event.key)) {
        event.preventDefault();
        disclosure.toggle();
      }
    };

    const onMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
      if (event.key === Keys.Escape) {
        disclosure.close();
        triggerRef.current?.focus();
        return;
      }
      if (event.key === Keys.Tab) {
        disclosure.close();
        return;
      }

      /*
       * A menu is a column, so navigation is always the vertical axis — the
       * same `resolveRovingKey` + `resolveListMove` pair `<pf-dropdown>` and
       * `ContextMenu` use.
       *
       * This clamped with `Math.min`/`Math.max` over a DOM query, so the
       * arrows stopped at both ends where the element and `ContextMenu`
       * wrapped: one design system with two menu behaviours. Driving it
       * through the hook also puts `activeIndex` and DOM focus on one path,
       * where before they were two that happened to agree because every
       * `.focus()` fires the item's `onFocus` — true, but only by accident.
       */
      const action = resolveRovingKey(event.key, 'vertical');
      if (!action) return;

      event.preventDefault();
      const nextIndex = move(action, activeIndex);
      if (nextIndex < 0) return;
      // One menuitem per item, in order, so the index addresses the button.
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[nextIndex]?.focus();
    };

    // Calculate maxHeight for menu if maxVisibleItems is set
    let menuMaxHeight: string | undefined;
    if (maxVisibleItems && items.length > 0) {
      // Each item is min-height: 34px + 2px gap except last
      menuMaxHeight = `calc(${maxVisibleItems} * 36px)`;
    }

    return (
      <div ref={rootRef} className={cx('pf-dropdown', className)} {...props}>
        <button
          ref={(node) => {
            triggerRef.current = node;
            if (typeof ref === 'function') {
              ref(node as unknown as HTMLDivElement);
            } else if (ref) {
              ref.current = node as unknown as HTMLDivElement;
            }
          }}
          type="button"
          className="pf-dropdown__trigger"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => {
            disclosure.toggle();
          }}
          onKeyDown={onTriggerKeyDown}
          disabled={disabled}
        >
          <span>{label}</span>
          <span
            className={cx('pf-dropdown__chevron', isOpen && 'pf-dropdown__chevron--open')}
            aria-hidden
          >
            <Icon name="chevron-down" aria-hidden />
          </span>
        </button>

        {isOpen && typeof document !== 'undefined'
          ? createPortal(
              <div
                id={menuId}
                ref={menuRef}
                className="pf-dropdown__menu"
                role="menu"
                tabIndex={-1}
                style={{
                  ...menuStyle,
                  ...(menuMaxHeight ? { maxHeight: menuMaxHeight, overflowY: 'auto' } : {}),
                }}
                onKeyDown={onMenuKeyDown}
              >
                {items.map((item, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id ?? `${item.label}-${index}`}
                      id={`${menuId}-item-${index}`}
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      className={cx(
                        'pf-dropdown__item',
                        isActive && 'pf-dropdown__item--active',
                        item.destructive && 'pf-dropdown__item--destructive',
                      )}
                      onFocus={() => {
                        if (!item.disabled) setActiveIndex(index);
                      }}
                      onMouseEnter={() => {
                        if (!item.disabled) {
                          setActiveIndex(index);
                        }
                      }}
                      onClick={() => {
                        if (item.disabled) {
                          return;
                        }
                        item.onSelect?.();
                        disclosure.close();
                        triggerRef.current?.focus();
                      }}
                    >
                      <span className="pf-dropdown__item-left">
                        {item.icon ? (
                          <span className="pf-dropdown__item-icon" aria-hidden>
                            {item.icon}
                          </span>
                        ) : null}
                        <span>{item.label}</span>
                      </span>
                      {item.shortcut ? (
                        <span className="pf-dropdown__item-shortcut">{item.shortcut}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>,
              document.body,
            )
          : null}
      </div>
    );
  },
);

Dropdown.displayName = 'Dropdown';
