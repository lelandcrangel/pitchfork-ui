import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './PieChart.css';

const fallbackColors = [
  'var(--color-brand-600)',
  'var(--color-brand-500)',
  'var(--color-gray-500)',
  '#06b6d4',
  '#22c55e',
  'var(--color-gray-500)',
] as const;

export interface PieChartDatum {
  label: React.ReactNode;
  value: number;
  color?: string;
}

export interface PieChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: PieChartDatum[];
  size?: number;
  cutout?: number;
  showLegend?: boolean;
  centerLabel?: React.ReactNode;
  emptyLabel?: React.ReactNode;
}

interface PreparedSegment extends PieChartDatum {
  color: string;
  value: number;
  percentage: number;
}

function clampCutout(value: number): number {
  return Math.min(Math.max(value, 0), 0.88);
}

function prepareSegments(data: PieChartDatum[]): PreparedSegment[] {
  const normalized = data.map((item, index) => ({
    ...item,
    value: Math.max(item.value, 0),
    color: item.color ?? fallbackColors[index % fallbackColors.length],
  }));
  const total = normalized.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return [];
  }

  return normalized
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      percentage: (item.value / total) * 100,
    }));
}

function toConicGradient(segments: PreparedSegment[]): string {
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    const end = cursor + segment.percentage;
    cursor = end;
    return `${segment.color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

export const PieChart = forwardRef<HTMLDivElement, PieChartProps>(
  function PieChart(
    { className, data, size = 192, cutout = 0.58, showLegend = true, centerLabel, emptyLabel = 'No data', ...props },
    ref,
  ) {
  const segments = prepareSegments(data);
  const hasData = segments.length > 0;
  const chartSize = Math.max(size, 120);
  const safeCutout = clampCutout(cutout);
  const centerSize = Math.round(chartSize * safeCutout);
  const conicGradient = hasData
    ? toConicGradient(segments)
    : 'conic-gradient(var(--color-semantic-background-subtle) 0% 100%)';

  return (
    <div ref={ref} className={cx('pf-pie-chart', className)} {...props}>
      <div
        className={cx(
          'pf-pie-chart__visual',
          !hasData && 'pf-pie-chart__visual--empty',
        )}
        style={{
          width: chartSize,
          height: chartSize,
          backgroundImage: conicGradient,
        }}
        role="img"
        aria-label="Pie chart"
      >
        <div
          className="pf-pie-chart__center"
          style={{ width: centerSize, height: centerSize }}
        >
          {hasData ? centerLabel : emptyLabel}
        </div>
      </div>

      {showLegend && hasData ? (
        <ul className="pf-pie-chart__legend">
          {segments.map((segment, index) => (
            <li
              className="pf-pie-chart__legend-item"
              key={`${index}-${segment.value}`}
            >
              <span
                className="pf-pie-chart__legend-dot"
                style={{ background: segment.color }}
                aria-hidden
              />
              <span className="pf-pie-chart__legend-label">
                {segment.label}
              </span>
              <span className="pf-pie-chart__legend-value">
                {Math.round(segment.percentage)}%
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

PieChart.displayName = 'PieChart';
