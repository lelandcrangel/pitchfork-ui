import {
  getRovingItems,
  resolveListMove,
  resolveRovingKey,
  syncRovingTabIndex,
} from '@pitchfork-ui/core';
import { forwardRef, useEffect, useRef } from 'react';
import { useComposedRefs } from '../../hooks';
import { cx } from '../../utils/cx';
import './Toolbar.css';

export type ToolbarOrientation = 'horizontal' | 'vertical';

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout + arrow-key axis. Defaults to `'horizontal'`. */
  orientation?: ToolbarOrientation;
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { className, orientation = 'horizontal', onKeyDown, onFocus, children, ...props },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const refs = useComposedRefs(rootRef, ref);

  const getItems = () => (rootRef.current ? getRovingItems(rootRef.current) : []);

  // Every render, so items added or removed since the last one are brought back
  // to exactly one tab stop. Core keeps an established stop rather than
  // resetting it, so this never moves the user's place.
  useEffect(() => {
    syncRovingTabIndex(getItems());
  });

  const handleFocus: React.FocusEventHandler<HTMLDivElement> = (event) => {
    syncRovingTabIndex(getItems(), event.target as HTMLElement);
    onFocus?.(event);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const action = resolveRovingKey(event.key, orientation);
    if (!action) return;

    const items = getItems();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    const nextIndex = resolveListMove(
      action,
      items.map((_, index) => index),
      currentIndex,
    );
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
