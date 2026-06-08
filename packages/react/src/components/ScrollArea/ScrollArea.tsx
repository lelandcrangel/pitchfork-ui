import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './ScrollArea.css';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which axis scrolls. Defaults to `'vertical'`. */
  orientation?: ScrollAreaOrientation;
  /**
   * Make the region keyboard-focusable so users can scroll it with the arrow
   * keys (WCAG 2.1.1). Defaults to true. Set false if a focusable child already
   * provides keyboard access.
   */
  focusable?: boolean;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { className, orientation = 'vertical', focusable = true, tabIndex, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx('pf-scroll-area', `pf-scroll-area--${orientation}`, className)}
      tabIndex={tabIndex ?? (focusable ? 0 : undefined)}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollArea.displayName = 'ScrollArea';
