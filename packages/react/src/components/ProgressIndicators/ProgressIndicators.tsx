import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './ProgressIndicators.css';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
  label?: string;
}

export interface ProgressCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  label?: string;
}

const clampPercent = (value: number, max: number) => {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (value / max) * 100));
};

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar({ value, max = 100, showValue = true, label, className, ...props }, ref) {
    const percent = clampPercent(value, max);

    return (
      <div
        ref={ref}
        className={cx('pf-progress-bar', className)}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round((percent / 100) * max)}
        {...props}
      >
        <div className="pf-progress-bar__track">
          <div
            className="pf-progress-bar__fill"
            style={{ '--pf-progress-fill': `${percent}%` } as React.CSSProperties}
          />
        </div>
        {showValue ? (
          <span className="pf-progress-bar__value">{Math.round(percent)}%</span>
        ) : null}
      </div>
    );
  },
);
ProgressBar.displayName = 'ProgressBar';

export const ProgressCircle = forwardRef<HTMLDivElement, ProgressCircleProps>(
  function ProgressCircle(
    { value, max = 100, size = 64, strokeWidth = 6, showValue = true, label, className, ...props },
    ref,
  ) {
    const percent = clampPercent(value, max);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - percent / 100);

    return (
      <div
        ref={ref}
        className={cx('pf-progress-circle', className)}
        style={{ '--pf-progress-circle-size': `${size}px` } as React.CSSProperties}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round((percent / 100) * max)}
        {...props}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="pf-progress-circle__svg"
          aria-hidden
        >
          <circle
            className="pf-progress-circle__track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className="pf-progress-circle__fill"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        {showValue ? (
          <span className="pf-progress-circle__value">
            {Math.round(percent)}%
          </span>
        ) : null}
      </div>
    );
  },
);
ProgressCircle.displayName = 'ProgressCircle';
