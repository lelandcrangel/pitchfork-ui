import { forwardRef, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Keys } from '../../a11y';
import {
  useComposedRefs,
  useListNavigation,
  useOutsideInteraction,
  usePresence,
} from '../../hooks';
import { cx } from '../../utils/cx';
import './ContextMenu.css';

export interface ContextMenuItem {
  id?: string;
  label: string;
  onSelect?: () => void;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
}

export interface ContextMenuSeparator {
  separator: true;
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

export interface ContextMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ContextMenuEntry[];
  /** Disable the menu entirely (right-click falls back to the native menu). */
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const isSeparator = (entry: ContextMenuEntry): entry is ContextMenuSeparator =>
  (entry as ContextMenuSeparator).separator === true;

const VIEWPORT_PADDING = 8;

export const ContextMenu = forwardRef<HTMLDivElement, ContextMenuProps>(function ContextMenu(
  { className, items, disabled = false, onOpenChange, children, onContextMenu, ...props },
  ref,
) {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [point, setPoint] = useState({ x: 0, y: 0 });
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useComposedRefs(rootRef, ref);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isMounted, isExiting } = usePresence(isOpen, 140);

  // Only actionable entries participate in keyboard navigation.
  const actionable = items.filter((e): e is ContextMenuItem => !isSeparator(e));
  const { activeIndex, move, setActiveIndex } = useListNavigation({
    items: actionable,
    isDisabled: (item) => Boolean(item.disabled),
  });

  const setOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  useOutsideInteraction({
    refs: [menuRef],
    enabled: isOpen,
    onInteractOutside: () => setOpen(false),
  });

  // Clamp the menu within the viewport once it has been measured.
  useLayoutEffect(() => {
    if (!isMounted || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const maxLeft = window.innerWidth - rect.width - VIEWPORT_PADDING;
    const maxTop = window.innerHeight - rect.height - VIEWPORT_PADDING;
    setCoords({
      left: Math.max(VIEWPORT_PADDING, Math.min(point.x, maxLeft)),
      top: Math.max(VIEWPORT_PADDING, Math.min(point.y, maxTop)),
    });
  }, [isMounted, point.x, point.y]);

  const handleContextMenu: React.MouseEventHandler<HTMLDivElement> = (event) => {
    onContextMenu?.(event);
    if (disabled || event.defaultPrevented) return;
    event.preventDefault();
    setPoint({ x: event.clientX, y: event.clientY });
    setCoords(null);
    setActiveIndex(actionable.findIndex((item) => !item.disabled));
    setOpen(true);
  };

  const select = (item: ContextMenuItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    setOpen(false);
  };

  const onMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === Keys.Escape) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === Keys.ArrowDown) {
      event.preventDefault();
      move('next');
    } else if (event.key === Keys.ArrowUp) {
      event.preventDefault();
      move('previous');
    } else if (event.key === Keys.Home) {
      event.preventDefault();
      move('first');
    } else if (event.key === Keys.End) {
      event.preventDefault();
      move('last');
    } else if (event.key === Keys.Enter || event.key === Keys.Space) {
      event.preventDefault();
      const item = actionable[activeIndex];
      if (item) select(item);
    }
  };

  // Focus the menu when it opens so keyboard nav works immediately.
  useLayoutEffect(() => {
    if (isMounted && coords) menuRef.current?.focus();
  }, [isMounted, coords]);

  let actionableIndex = -1;

  return (
    <div
      ref={rootRefs}
      className={cx('pf-context-menu', className)}
      onContextMenu={handleContextMenu}
      {...props}
    >
      {children}

      {isMounted && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={menuId}
              ref={menuRef}
              role="menu"
              aria-label="Context menu"
              tabIndex={-1}
              aria-activedescendant={
                actionable[activeIndex] ? `${menuId}-item-${activeIndex}` : undefined
              }
              className={cx('pf-context-menu__menu', isExiting && 'pf-context-menu__menu--exiting')}
              style={{
                position: 'fixed',
                left: coords?.left ?? point.x,
                top: coords?.top ?? point.y,
                // Hide until clamped to avoid a flash at the unclamped position.
                visibility: coords ? 'visible' : 'hidden',
              }}
              onKeyDown={onMenuKeyDown}
            >
              {items.map((entry, index) => {
                if (isSeparator(entry)) {
                  return (
                    <div
                      key={`sep-${index}`}
                      role="separator"
                      className="pf-context-menu__separator"
                    />
                  );
                }
                actionableIndex += 1;
                const itemIndex = actionableIndex;
                const isActive = itemIndex === activeIndex;
                return (
                  <button
                    key={entry.id ?? `${entry.label}-${index}`}
                    id={`${menuId}-item-${itemIndex}`}
                    type="button"
                    role="menuitem"
                    disabled={entry.disabled}
                    className={cx(
                      'pf-context-menu__item',
                      isActive && 'pf-context-menu__item--active',
                      entry.destructive && 'pf-context-menu__item--destructive',
                    )}
                    onMouseEnter={() => {
                      if (!entry.disabled) setActiveIndex(itemIndex);
                    }}
                    onClick={() => select(entry)}
                  >
                    {entry.icon ? (
                      <span className="pf-context-menu__item-icon" aria-hidden>
                        {entry.icon}
                      </span>
                    ) : null}
                    <span className="pf-context-menu__item-label">{entry.label}</span>
                    {entry.shortcut ? (
                      <kbd className="pf-context-menu__item-shortcut">{entry.shortcut}</kbd>
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
});

ContextMenu.displayName = 'ContextMenu';
