import { forwardRef } from 'react';
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

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  function LoadingSpinner({ className, size = 24, label = 'Loading', ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cx('pf-loading-spinner', className)}
        style={{ '--pf-spinner-size': `${size}px` } as React.CSSProperties}
        role="status"
        aria-label={label}
        {...props}
      >
        <span className="pf-sr-only">{label}</span>
      </div>
    );
  },
);
LoadingSpinner.displayName = 'LoadingSpinner';

export const LoadingDots = forwardRef<HTMLDivElement, LoadingDotsProps>(
  function LoadingDots({ className, size = 'md', label = 'Loading', ...props }, ref) {
    return (
      <div
        ref={ref}
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
  },
);
LoadingDots.displayName = 'LoadingDots';

export const LoadingSkeleton = forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  function LoadingSkeleton(
    { className, width = '100%', height = 16, rounded = false, label = 'Loading content', ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
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
  },
);
LoadingSkeleton.displayName = 'LoadingSkeleton';
