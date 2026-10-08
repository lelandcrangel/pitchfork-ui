import { sparklineAreaPath, sparklineLinePath, sparklinePoints } from '@pitchfork-ui/core';
import { forwardRef, useMemo } from 'react';
import { cx } from '../../utils/cx';
import './Sparkline.css';

export type SparklineVariant = 'line' | 'area';
export type SparklineTrend = 'up' | 'down' | 'neutral';

export interface SparklineProps extends React.HTMLAttributes<SVGSVGElement> {
  data: number[];
  width?: number;
  height?: number;
  variant?: SparklineVariant;
  strokeWidth?: number;
  color?: string;
  /** Show a dot at the last data point */
  endDot?: boolean;
  /** Animate the line drawing in (and area fading in) on mount. Off by default. */
  animate?: boolean;
  /** Accessible label for screen readers */
  label?: string;
}

export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
  {
    className,
    data = [],
    width = 120,
    height = 36,
    variant = 'line',
    strokeWidth = 1.5,
    color,
    endDot = false,
    animate = false,
    label,
    style,
    ...props
  },
  ref,
) {
  const padding = strokeWidth + 2;

  /*
   * All of the geometry is core's, so `<pf-sparkline>` draws the same numbers
   * the same way — including the three edge cases this got wrong: one value
   * divided by `length - 1` and gave `NaN`, a flat series was pinned to an
   * edge rather than centred, and the closing branch of the old `buildPath`
   * interpolated a boolean into the path (never reached, because no call site
   * passed the flag).
   */
  const points = useMemo(
    () => sparklinePoints(data, { width, height, padding }),
    [data, width, height, padding],
  );

  const linePath = useMemo(() => sparklineLinePath(points), [points]);

  const areaPath = useMemo(
    () => (variant === 'area' ? sparklineAreaPath(points, height - padding + strokeWidth) : ''),
    [points, variant, height, padding, strokeWidth],
  );

  const lastPoint = points[points.length - 1];

  const colorVar = color ?? 'var(--pf-sparkline-color)';

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cx(
        'pf-sparkline',
        `pf-sparkline--${variant}`,
        animate && 'pf-sparkline--animated',
        className,
      )}
      aria-label={label}
      role={label ? 'img' : 'presentation'}
      style={{ '--pf-sparkline-color-override': color, ...style } as React.CSSProperties}
      {...props}
    >
      {variant === 'area' && areaPath && (
        <path d={areaPath} fill={colorVar} className="pf-sparkline__area" />
      )}
      {linePath && (
        <path
          d={linePath}
          fill="none"
          stroke={colorVar}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={animate ? 1 : undefined}
          className="pf-sparkline__line"
        />
      )}
      {endDot && lastPoint && (
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r={strokeWidth + 1.5}
          fill={colorVar}
          className="pf-sparkline__dot"
        />
      )}
    </svg>
  );
});

Sparkline.displayName = 'Sparkline';
