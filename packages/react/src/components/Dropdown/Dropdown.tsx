import { createPortal } from 'react-dom';
import { forwardRef, useEffect, useId, useRef, useState } from 'react';
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
}

const findNextEnabledIndex = (
  items: DropdownItem[],
  startIndex: number,
  direction: 1 | -1,
) => {
  if (items.length === 0) {
    return -1;
  }

  let index = startIndex;
  for (let step = 0; step < items.length; step += 1) {
    index = (index + direction + items.length) % items.length;
    if (!items[index]?.disabled) {
      return index;
    }
  }

  return -1;
};

const findFirstEnabledIndex = (items: DropdownItem[]) => {
  return items.findIndex((item) => !item.disabled);
};

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      label = 'Actions',
      items,
      align = 'start',
      disabled,
      className,
      ...props
    },
    ref,
  ) => {
    const menuId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(() =>
      findFirstEnabledIndex(items),
    );
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      setActiveIndex(findFirstEnabledIndex(items));
    }, [isOpen, items]);

    useEffect(() => {
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (
          !rootRef.current?.contains(target) &&
          !menuRef.current?.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      };

      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleEscape);
      };
    }, []);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const updateMenuPosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) {
          return;
        }

        const rect = trigger.getBoundingClientRect();
        const width = Math.max(rect.width, 200);
        const left =
          align === 'end'
            ? Math.max(8, rect.right - width)
            : Math.min(rect.left, window.innerWidth - width - 8);

        setMenuStyle({
          left,
          top: rect.bottom + 8,
          width,
        });
      };

      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true);

      return () => {
        window.removeEventListener('resize', updateMenuPosition);
        window.removeEventListener('scroll', updateMenuPosition, true);
      };
    }, [align, isOpen]);

    const onTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (
      event,
    ) => {
      if (disabled) {
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();

        if (!isOpen) {
          setIsOpen(true);
          return;
        }

        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const startIndex = activeIndex >= 0 ? activeIndex : 0;
        const nextIndex = findNextEnabledIndex(items, startIndex, direction);
        if (nextIndex >= 0) {
          setActiveIndex(nextIndex);
        }
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
    };

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
          aria-controls={isOpen ? menuId : undefined}
          onClick={() => {
            if (!disabled) {
              setIsOpen((value) => !value);
            }
          }}
          onKeyDown={onTriggerKeyDown}
          disabled={disabled}
        >
          <span>{label}</span>
          <span
            className={cx(
              'pf-dropdown__chevron',
              isOpen && 'pf-dropdown__chevron--open',
            )}
            aria-hidden
          >
            <Icon name="square-caret-down" aria-hidden />
          </span>
        </button>

        {isOpen && typeof document !== 'undefined'
          ? createPortal(
              <div
                id={menuId}
                ref={menuRef}
                className="pf-dropdown__menu"
                role="menu"
                style={menuStyle}
              >
                {items.map((item, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={item.id ?? `${item.label}-${index}`}
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      className={cx(
                        'pf-dropdown__item',
                        isActive && 'pf-dropdown__item--active',
                        item.destructive && 'pf-dropdown__item--destructive',
                      )}
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
                        setIsOpen(false);
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
                        <span className="pf-dropdown__item-shortcut">
                          {item.shortcut}
                        </span>
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
