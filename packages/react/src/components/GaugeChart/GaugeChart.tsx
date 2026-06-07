import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './GaugeChart.css';

export interface GaugeChartProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current value */
  value: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Label rendered in the center of the gauge. Defaults to the percentage string. */
  centerLabel?: React.ReactNode;
  /** Secondary label rendered below the center label */
  subLabel?: React.ReactNode;
  /** Diameter in pixels */
  size?: number;
  /** Arc stroke thickness in pixels */
  strokeWidth?: number;
  /** Override the filled arc color. Defaults to `--pf-gauge-color`. */
  color?: string;
}

export const GaugeChart = forwardRef<HTMLDivElement, GaugeChartProps>(function GaugeChart(
  {
    className,
    value,
    max = 100,
    centerLabel,
    subLabel,
    size = 200,
    strokeWidth = 16,
    color,
    style,
    ...props
  },
  ref,
) {
  const clamped = Math.min(Math.max(value, 0), max);
  const progress = max > 0 ? clamped / max : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = progress * circumference;
  const gap = circumference - filled;

  const center = size / 2;
  const pct = Math.round(progress * 100);
  const defaultLabel = `${pct}%`;

  const colorVar = color ?? 'var(--pf-gauge-color)';

  return (
    <div
      ref={ref}
      className={cx('pf-gauge', className)}
      style={{ width: size, height: size, ...style } as React.CSSProperties}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${pct}%`}
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="pf-gauge__svg"
      >
        {/* Track (background arc) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="pf-gauge__track"
        />

        {/* Filled arc — starts at 12 o'clock via transform */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colorVar}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${center}px ${center}px` }}
          className="pf-gauge__fill"
        />
      </svg>

      <div className="pf-gauge__center" aria-hidden="true">
        <span className="pf-gauge__label">{centerLabel ?? defaultLabel}</span>
        {subLabel ? <span className="pf-gauge__sub-label">{subLabel}</span> : null}
      </div>
    </div>
  );
});

GaugeChart.displayName = 'GaugeChart';
