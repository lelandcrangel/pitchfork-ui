import { cx } from '../../utils/cx';
import './Badge.css';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return <span className={cx('pf-badge', `pf-badge--${variant}`, className)} {...props} />;
}
