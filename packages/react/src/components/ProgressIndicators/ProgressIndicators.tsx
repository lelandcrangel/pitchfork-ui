import { cx } from '../../utils/cx';
import './ProgressIndicators.css';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
}

export interface ProgressCircleProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
}

const clampPercent = (value: number, max: number) => {
  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (value / max) * 100));
};

export function ProgressBar({
  value,
  max = 100,
  showValue = true,
  className,
  ...props
}: ProgressBarProps) {
  const percent = clampPercent(value, max);

  return (
    <div className={cx('pf-progress-bar', className)} {...props}>
      <div
        className="pf-progress-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round((percent / 100) * max)}
      >
        <div
          className="pf-progress-bar__fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showValue ? (
        <span className="pf-progress-bar__value">{Math.round(percent)}%</span>
      ) : null}
    </div>
  );
}

export function ProgressCircle({
  value,
  max = 100,
  size = 64,
  strokeWidth = 6,
  showValue = true,
  className,
  ...props
}: ProgressCircleProps) {
  const percent = clampPercent(value, max);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <div
      className={cx('pf-progress-circle', className)}
      style={{ width: size, height: size }}
      role="progressbar"
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
}
