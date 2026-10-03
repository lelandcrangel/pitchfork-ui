import { clampProgressPercent, getProgressCircleGeometry } from '@pitchfork-ui/core';
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
  /*
   * Core's, which `ProgressCircle` and `<pf-progress-circle>` already share:
   * the dash offset only lands on the right angle if it and the circumference
   * came from the same radius, and the radius has to be inset by half the
   * stroke or half of it paints outside the viewBox. Reusing it also fixes a
   * `NaN` here — `Math.min(Math.max(NaN, 0), max)` is `NaN`, which reached
   * the DOM as `--pf-gauge-offset: NaN`.
   */
  const pct = Math.round(clampProgressPercent(value, max));
  const {
    radius,
    circumference,
    dashOffset: offset,
    center,
  } = getProgressCircleGeometry(size, strokeWidth, pct);
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
          strokeDasharray={circumference}
          style={
            {
              transform: 'rotate(-90deg)',
              transformOrigin: `${center}px ${center}px`,
              '--pf-gauge-circumference': circumference,
              '--pf-gauge-offset': offset,
            } as React.CSSProperties
          }
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
