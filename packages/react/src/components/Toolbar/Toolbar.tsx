import { forwardRef, useEffect, useRef } from 'react';
import { Keys } from '../../a11y';
import { useComposedRefs } from '../../hooks';
import { cx } from '../../utils/cx';
import './Toolbar.css';

export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout + arrow-key axis. Defaults to `'horizontal'`. */
  orientation?: ToolbarOrientation;
}

// Interactive children, matched regardless of their current (roving) tabindex.
const ITEM_SELECTOR =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [data-toolbar-item]:not([aria-disabled="true"])';

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { className, orientation = 'horizontal', onKeyDown, onFocus, children, ...props },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const refs = useComposedRefs(rootRef, ref);

  const getItems = () =>
    rootRef.current ? Array.from(rootRef.current.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) : [];

  // Maintain exactly one roving tab stop without clobbering the user's current one.
  // Read the explicit tabindex *attribute* — native buttons report `.tabIndex === 0`
  // even without one, which would otherwise look like an existing tab stop.
  useEffect(() => {
    const items = getItems();
    if (items.length === 0) return;
    const current = items.find((el) => el.getAttribute('tabindex') === '0');
    items.forEach((el, i) => {
      el.tabIndex = (current ? el === current : i === 0) ? 0 : -1;
    });
  });

  const handleFocus: React.FocusEventHandler<HTMLDivElement> = (event) => {
    const items = getItems();
    const target = event.target as HTMLElement;
    if (items.includes(target)) {
      items.forEach((el) => {
        el.tabIndex = el === target ? 0 : -1;
      });
    }
    onFocus?.(event);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const nextKey = orientation === 'vertical' ? Keys.ArrowDown : Keys.ArrowRight;
    const prevKey = orientation === 'vertical' ? Keys.ArrowUp : Keys.ArrowLeft;

    const items = getItems();
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    let nextIndex = -1;
    if (event.key === nextKey) nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === prevKey) nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === Keys.Home) nextIndex = 0;
    else if (event.key === Keys.End) nextIndex = items.length - 1;

    if (nextIndex >= 0) {
      event.preventDefault();
      items[nextIndex].focus();
    }
  };

  return (
    <div
      ref={refs}
      role="toolbar"
      aria-orientation={orientation}
      className={cx('pf-toolbar', `pf-toolbar--${orientation}`, className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </div>
  );
});

Toolbar.displayName = 'Toolbar';

export type ToolbarSeparatorProps = React.HTMLAttributes<HTMLSpanElement>;

export const ToolbarSeparator = forwardRef<HTMLSpanElement, ToolbarSeparatorProps>(
  function ToolbarSeparator({ className, ...props }, ref) {
    return (
      <span
        ref={ref}
        role="separator"
        className={cx('pf-toolbar__separator', className)}
        {...props}
      />
    );
  },
);

ToolbarSeparator.displayName = 'ToolbarSeparator';
