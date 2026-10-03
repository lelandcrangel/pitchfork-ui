import {
  clampPieCutout,
  pieConicGradient,
  preparePieSegments,
  roundPercentages,
} from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './PieChart.css';

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

export const PieChart = forwardRef<HTMLDivElement, PieChartProps>(function PieChart(
  {
    className,
    data,
    size = 192,
    cutout = 0.58,
    showLegend = true,
    centerLabel,
    emptyLabel = 'No data',
    ...props
  },
  ref,
) {
  /*
   * All of it is core's, so `<pf-pie-chart>` draws the same wedges and prints
   * the same legend — including the two things this got wrong. The total was
   * taken *before* the non-positive values were filtered out, so one `NaN`
   * made the total `NaN`, slipped past a `total <= 0` guard, and left every
   * surviving slice at `NaN%`: an invalid gradient and a blank chart. And
   * each legend percentage was rounded on its own, so three equal thirds read
   * "33%, 33%, 33%".
   */
  const segments = preparePieSegments(data);
  const hasData = segments.length > 0;
  const shares = roundPercentages(segments.map((segment) => segment.percentage));
  const chartSize = Math.max(size, 120);
  const centerSize = Math.round(chartSize * clampPieCutout(cutout));
  const conicGradient = hasData
    ? pieConicGradient(segments)
    : 'conic-gradient(var(--pf-piechart-empty) 0% 100%)';

  return (
    <div ref={ref} className={cx('pf-pie-chart', className)} {...props}>
      <div
        className={cx('pf-pie-chart__visual', !hasData && 'pf-pie-chart__visual--empty')}
        style={{ width: chartSize, height: chartSize } as React.CSSProperties}
        role="img"
        aria-label="Pie chart"
      >
        {/* Gradient layer replaces ::before so axe can compute text contrast on the center label */}
        <div
          className="pf-pie-chart__gradient"
          style={{ '--pf-pie-gradient': conicGradient } as React.CSSProperties}
          aria-hidden
        />
        <div className="pf-pie-chart__center" style={{ width: centerSize, height: centerSize }}>
          {hasData ? centerLabel : emptyLabel}
        </div>
      </div>

      {showLegend && hasData ? (
        <ul className="pf-pie-chart__legend">
          {segments.map((segment, position) => (
            <li className="pf-pie-chart__legend-item" key={`${segment.index}-${segment.value}`}>
              <span
                className="pf-pie-chart__legend-dot"
                style={{ background: segment.color }}
                aria-hidden
              />
              <span className="pf-pie-chart__legend-label">{data[segment.index].label}</span>
              <span className="pf-pie-chart__legend-value">{shares[position]}%</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

PieChart.displayName = 'PieChart';
