import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './Badge.css';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-badge>`, or `PfBadge` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-badge>`, or `PfBadge` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-badge>`, or `PfBadge` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', ...props }, ref) => (
    <span ref={ref} className={cx('pf-badge', `pf-badge--${variant}`, className)} {...props} />
  ),
);

Badge.displayName = 'Badge';
