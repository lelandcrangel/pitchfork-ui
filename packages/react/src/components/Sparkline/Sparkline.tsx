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

function buildPath(points: [number, number][], close = false): string {
  if (points.length < 2) return '';
  const [first, ...rest] = points;
  const d = [`M ${first[0]} ${first[1]}`];
  for (const [x, y] of rest) {
    d.push(`L ${x} ${y}`);
  }
  if (close) {
    const lastX = points[points.length - 1][0];
    const height = points[points.length - 1][1]; // will be overridden below
    void height;
    d.push(`L ${lastX} ${close}`);
    d.push(`L ${first[0]} ${close}`);
    d.push('Z');
  }
  return d.join(' ');
}

function normalizePoints(
  data: number[],
  width: number,
  height: number,
  padding: number,
): [number, number][] {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  return data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * innerW;
    const y = padding + (1 - (value - min) / range) * innerH;
    return [x, y];
  });
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

  const points = useMemo(
    () => normalizePoints(data, width, height, padding),
    [data, width, height, padding],
  );

  const linePath = useMemo(() => buildPath(points), [points]);

  const areaPath = useMemo(() => {
    if (variant !== 'area' || points.length < 2) return '';
    const [first, ...rest] = points;
    const d = [`M ${first[0]} ${first[1]}`];
    for (const [x, y] of rest) {
      d.push(`L ${x} ${y}`);
    }
    const lastX = points[points.length - 1][0];
    const bottom = height - padding + strokeWidth;
    d.push(`L ${lastX} ${bottom}`);
    d.push(`L ${first[0]} ${bottom}`);
    d.push('Z');
    return d.join(' ');
  }, [points, variant, height, padding, strokeWidth]);

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
