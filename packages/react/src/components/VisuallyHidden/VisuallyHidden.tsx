import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './VisuallyHidden.css';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  /** Element to render. Defaults to `span`. */
  as?: 'span' | 'div' | 'p' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /**
   * Reveal the content when it (or a descendant) receives keyboard focus —
   * the classic "skip link" pattern. Defaults to false.
   */
  focusable?: boolean;
}

/**
 * Hides content visually while keeping it available to screen readers and other
 * assistive technology. Use for labels, instructions, and status text that are
 * implied visually but need to be announced.
 */
export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(function VisuallyHidden(
  { as = 'span', focusable = false, className, ...props },
  ref,
) {
  const Component = as as React.ElementType;
  return (
    <Component
      ref={ref}
      className={cx('pf-visually-hidden', focusable && 'pf-visually-hidden--focusable', className)}
      {...props}
    />
  );
});

VisuallyHidden.displayName = 'VisuallyHidden';
