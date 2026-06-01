import { cx } from '../../utils/cx';
import './LoadingIndicators.css';

export interface LoadingSpinnerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  size?: number;
  label?: string;
}

export interface LoadingDotsProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export interface LoadingSkeletonProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children'
> {
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  label?: string;
}

export function LoadingSpinner({
  className,
  size = 24,
  label = 'Loading',
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cx('pf-loading-spinner', className)}
      style={{ '--pf-spinner-size': `${size}px` } as React.CSSProperties}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className="pf-sr-only">{label}</span>
    </div>
  );
}

export function LoadingDots({
  className,
  size = 'md',
  label = 'Loading',
  ...props
}: LoadingDotsProps) {
  return (
    <div
      className={cx('pf-loading-dots', `pf-loading-dots--${size}`, className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className="pf-loading-dots__dot" aria-hidden />
      <span className="pf-loading-dots__dot" aria-hidden />
      <span className="pf-loading-dots__dot" aria-hidden />
      <span className="pf-sr-only">{label}</span>
    </div>
  );
}

export function LoadingSkeleton({
  className,
  width = '100%',
  height = 16,
  rounded = false,
  label = 'Loading content',
  ...props
}: LoadingSkeletonProps) {
  return (
    <div
      className={cx(
        'pf-loading-skeleton',
        rounded ? 'pf-loading-skeleton--rounded' : undefined,
        className,
      )}
      style={{
        '--pf-skeleton-width': typeof width === 'number' ? `${width}px` : width,
        '--pf-skeleton-height': typeof height === 'number' ? `${height}px` : height,
      } as React.CSSProperties}
      role="status"
      aria-label={label}
      {...props}
    >
      <span className="pf-sr-only">{label}</span>
    </div>
  );
}
