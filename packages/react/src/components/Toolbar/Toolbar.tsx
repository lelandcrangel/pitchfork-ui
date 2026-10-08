import { forwardRef, useRef } from 'react';
import { useComposedRefs, useRovingTabIndex } from '../../hooks';
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

  const roving = useRovingTabIndex({ ref: rootRef, orientation });

  const handleFocus: React.FocusEventHandler<HTMLDivElement> = (event) => {
    roving.onFocus(event);
    onFocus?.(event);
  };

  /*
   * The consumer's handler first, so `preventDefault()` in it keeps the arrows
   * for itself -- the hook checks `defaultPrevented`.
   */
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event);
    roving.onKeyDown(event);
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
