import {
  CHART_PADDING,
  CHART_PLOT,
  CHART_VIEW,
  areaSeriesPath,
  axisLabelStep,
  barGeometry,
  chartSeriesColor,
  formatAxisTick,
  niceAxisTicks,
  plotX,
  plotY,
  smoothSeriesPath,
  straightSeriesPath,
} from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './LineBarChart.css';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
  dashed?: boolean;
}

// ─── Internal constants ───────────────────────────────────────────────────

/*
 * Every number and every path below is core's, so `<pf-line-chart>` and
 * `<pf-bar-chart>` draw the same scales. The axis labels and the geometry
 * have to come from the same tick scale: a chart whose gridlines say 40 and
 * whose line peaks at three-quarters height is worse than one with no
 * gridlines at all.
 */
const PAD = CHART_PADDING;
const VIEW_W = CHART_VIEW.width;
const VIEW_H = CHART_VIEW.height;
const PLOT_W = CHART_PLOT.width;
const PLOT_H = CHART_PLOT.height;

// The SVG scales to 100% width, so the plot area's left inset is a fixed
// fraction of the rendered width. Exposed as a CSS var so the legend can
// align its start edge with the plot area (see .pf-chart-legend).
const PLOT_INSET_STYLE = {
  '--pf-chart-plot-inset-left': `${(PAD.left / VIEW_W) * 100}%`,
} as React.CSSProperties;

function resolveColor(series: ChartSeries, index: number): string {
  return chartSeriesColor(index, series.color);
}

function formatTick(value: number, formatter?: (v: number) => string): string {
  return formatter ? formatter(value) : formatAxisTick(value);
}

const toY = (value: number, maxTick: number) => plotY(value, maxTick);
const toX = (index: number, count: number) => plotX(index, count);

// ─── Shared internal components ───────────────────────────────────────────

type ResolvedSeries = ChartSeries & { color: string };

function ChartLegend({ series }: { series: ResolvedSeries[] }) {
  return (
    <ul className="pf-chart-legend">
      {series.map((s) => (
        <li key={s.key} className="pf-chart-legend__item">
          <span
            className="pf-chart-legend__swatch"
            style={{ background: s.color }}
            aria-hidden="true"
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

interface AxesProps {
  yTicks: number[];
  xLabels: string[];
  xPositions?: number[];
  maxTick: number;
  yAxisLabel?: string;
  valueFormatter?: (v: number) => string;
}

function Axes({ yTicks, xLabels, xPositions, maxTick, yAxisLabel, valueFormatter }: AxesProps) {
  const n = xLabels.length;
  const labelStep = axisLabelStep(n);

  return (
    <>
      {yTicks.map((tick) => {
        const y = toY(tick, maxTick);
        return (
          <g key={tick}>
            <line x1={PAD.left} y1={y} x2={PAD.left + PLOT_W} y2={y} className="pf-chart__grid" />
            <text x={PAD.left - 8} y={y} className="pf-chart__tick pf-chart__tick--y">
              {formatTick(tick, valueFormatter)}
            </text>
          </g>
        );
      })}

      {xLabels.map((label, i) =>
        i % labelStep !== 0 ? null : (
          <text
            key={i}
            x={xPositions ? xPositions[i] : toX(i, n)}
            y={PAD.top + PLOT_H + 20}
            className="pf-chart__tick pf-chart__tick--x"
          >
            {label}
          </text>
        ),
      )}

      {yAxisLabel ? (
        <text
          x={-(PAD.top + PLOT_H / 2)}
          y={14}
          transform="rotate(-90)"
          className="pf-chart__axis-label"
        >
          {yAxisLabel}
        </text>
      ) : null}
    </>
  );
}

// ─── LineChart ────────────────────────────────────────────────────────────

export interface LineChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  series: ChartSeries[];
  yAxisLabel?: string;
  showLegend?: boolean;
  area?: boolean;
  curved?: boolean;
  valueFormatter?: (value: number) => string;
}

export const LineChart = forwardRef<HTMLDivElement, LineChartProps>(function LineChart(
  {
    className,
    style,
    data,
    series,
    yAxisLabel,
    showLegend = true,
    area = false,
    curved = true,
    valueFormatter,
    ...props
  },
  ref,
) {
  if (!data.length || !series.length) {
    return (
      <div ref={ref} className={cx('pf-chart', className)} style={style} {...props}>
        <div className="pf-chart__empty">No data</div>
      </div>
    );
  }

  const allValues = series.flatMap((s) => data.map((d) => Number(d[s.key] ?? 0)));
  const maxVal = Math.max(...allValues, 0);
  const yTicks = niceAxisTicks(maxVal);
  const maxTick = yTicks[yTicks.length - 1];
  const n = data.length;

  const resolvedSeries: ResolvedSeries[] = series.map((s, i) => ({
    ...s,
    color: resolveColor(s, i),
  }));

  return (
    <div
      ref={ref}
      className={cx('pf-chart', className)}
      style={{ ...PLOT_INSET_STYLE, ...style }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="pf-chart__svg"
        role="img"
        aria-label={yAxisLabel ?? 'Line chart'}
      >
        <Axes
          yTicks={yTicks}
          xLabels={data.map((d) => d.label)}
          maxTick={maxTick}
          yAxisLabel={yAxisLabel}
          valueFormatter={valueFormatter}
        />

        {resolvedSeries.map((s) => {
          const points = data.map((d, i) => ({
            x: toX(i, n),
            y: toY(Number(d[s.key] ?? 0), maxTick),
          }));

          const linePath = curved ? smoothSeriesPath(points) : straightSeriesPath(points);
          const areaPath = area ? areaSeriesPath(linePath, points) : null;

          return (
            <g key={s.key}>
              {areaPath ? (
                <path d={areaPath} fill={s.color} fillOpacity={0.12} stroke="none" />
              ) : null}
              <path
                d={linePath}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? '6 4' : undefined}
              />
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={3.5}
                  fill={s.color}
                  className="pf-chart__dot"
                >
                  <title>{`${data[i].label}: ${formatTick(Number(data[i][s.key] ?? 0), valueFormatter)}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      {showLegend && resolvedSeries.length > 1 ? <ChartLegend series={resolvedSeries} /> : null}
    </div>
  );
});

LineChart.displayName = 'LineChart';

// ─── AreaChart ────────────────────────────────────────────────────────────

export type AreaChartProps = Omit<LineChartProps, 'area'>;

export const AreaChart = forwardRef<HTMLDivElement, AreaChartProps>(function AreaChart(props, ref) {
  return <LineChart {...props} area ref={ref} />;
});

AreaChart.displayName = 'AreaChart';

// ─── BarChart ─────────────────────────────────────────────────────────────

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  series: ChartSeries[];
  yAxisLabel?: string;
  showLegend?: boolean;
  stacked?: boolean;
  valueFormatter?: (value: number) => string;
}

export const BarChart = forwardRef<HTMLDivElement, BarChartProps>(function BarChart(
  {
    className,
    style,
    data,
    series,
    yAxisLabel,
    showLegend = true,
    stacked = false,
    valueFormatter,
    ...props
  },
  ref,
) {
  if (!data.length || !series.length) {
    return (
      <div ref={ref} className={cx('pf-chart', className)} style={style} {...props}>
        <div className="pf-chart__empty">No data</div>
      </div>
    );
  }

  const n = data.length;
  const m = series.length;

  const groupMaxValues = stacked
    ? data.map((d) => series.reduce((sum, s) => sum + Number(d[s.key] ?? 0), 0))
    : series.flatMap((s) => data.map((d) => Number(d[s.key] ?? 0)));
  const maxVal = Math.max(...groupMaxValues, 0);
  const yTicks = niceAxisTicks(maxVal);
  const maxTick = yTicks[yTicks.length - 1];

  /*
   * Core's, and `barWidth` is floored at 1 there: the old
   * `(total - gap * (m - 1)) / m` goes negative with enough series, and a
   * negative `width` on a `<rect>` is an error the browser drops the element
   * for — a chart of twelve series silently lost its bars.
   */
  const {
    barWidth: barW,
    gap,
    groupLefts,
    groupCenters: barXPositions,
  } = barGeometry(n, m, stacked);

  const resolvedSeries: ResolvedSeries[] = series.map((s, i) => ({
    ...s,
    color: resolveColor(s, i),
  }));

  return (
    <div
      ref={ref}
      className={cx('pf-chart', className)}
      style={{ ...PLOT_INSET_STYLE, ...style }}
      {...props}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="pf-chart__svg"
        role="img"
        aria-label={yAxisLabel ?? 'Bar chart'}
      >
        <Axes
          yTicks={yTicks}
          xLabels={data.map((d) => d.label)}
          xPositions={barXPositions}
          maxTick={maxTick}
          yAxisLabel={yAxisLabel}
          valueFormatter={valueFormatter}
        />

        {data.map((d, di) => {
          const groupLeft = groupLefts[di];
          let stackBase = 0;

          return (
            <g key={`group-${di}`}>
              {resolvedSeries.map((s, si) => {
                const value = Math.max(0, Number(d[s.key] ?? 0));
                const barH = (value / maxTick) * PLOT_H;
                const barX = stacked ? groupLeft : groupLeft + si * (barW + gap);
                const barY = stacked ? toY(stackBase + value, maxTick) : PAD.top + PLOT_H - barH;

                if (stacked) stackBase += value;

                return (
                  <rect
                    key={s.key}
                    x={barX}
                    y={barY}
                    width={barW}
                    height={Math.max(0, barH)}
                    fill={s.color}
                    rx={2}
                    className="pf-chart__bar"
                  >
                    <title>{`${d.label} — ${s.label}: ${formatTick(value, valueFormatter)}`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
      </svg>

      {showLegend && resolvedSeries.length > 1 ? <ChartLegend series={resolvedSeries} /> : null}
    </div>
  );
});

BarChart.displayName = 'BarChart';
