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

const CHART_COLORS = [
  'var(--pf-chart-color-1)',
  'var(--pf-chart-color-2)',
  'var(--pf-chart-color-3)',
  'var(--pf-chart-color-4)',
  'var(--pf-chart-color-5)',
  'var(--pf-chart-color-6)',
];

const PAD = { top: 16, right: 16, bottom: 40, left: 56 };
const VIEW_W = 560;
const VIEW_H = 240;
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

// ─── Utilities ────────────────────────────────────────────────────────────

function resolveColor(series: ChartSeries, index: number): string {
  return series.color ?? CHART_COLORS[index % CHART_COLORS.length];
}

function niceYTicks(maxVal: number, count = 5): number[] {
  if (maxVal <= 0) return [0, 1, 2, 3, 4, 5];
  const rough = maxVal / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = ([1, 2, 2.5, 5, 10].find((s) => s * mag >= rough) ?? 10) * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= maxVal * 1.001; v += step) ticks.push(v);
  return ticks;
}

function formatTick(value: number, formatter?: (v: number) => string): string {
  if (formatter) return formatter(value);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return String(Math.round(value));
}

function toY(value: number, maxTick: number): number {
  return PAD.top + PLOT_H - (value / maxTick) * PLOT_H;
}

function toX(index: number, count: number): number {
  if (count <= 1) return PAD.left + PLOT_W / 2;
  return PAD.left + (index / (count - 1)) * PLOT_W;
}

// Catmull-Rom → cubic bezier conversion for smooth chart lines
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2)
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x},${p2.y}`;
  }
  return d;
}

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
  maxTick: number;
  yAxisLabel?: string;
  valueFormatter?: (v: number) => string;
}

function Axes({ yTicks, xLabels, maxTick, yAxisLabel, valueFormatter }: AxesProps) {
  const n = xLabels.length;
  const labelStep = Math.max(1, Math.ceil(n / 12));

  return (
    <>
      {yTicks.map((tick) => {
        const y = toY(tick, maxTick);
        return (
          <g key={tick}>
            <line
              x1={PAD.left}
              y1={y}
              x2={PAD.left + PLOT_W}
              y2={y}
              className="pf-chart__grid"
            />
            <text
              x={PAD.left - 8}
              y={y}
              className="pf-chart__tick pf-chart__tick--y"
            >
              {formatTick(tick, valueFormatter)}
            </text>
          </g>
        );
      })}

      {xLabels.map((label, i) =>
        i % labelStep !== 0 ? null : (
          <text
            key={i}
            x={toX(i, n)}
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

export function LineChart({
  className,
  data,
  series,
  yAxisLabel,
  showLegend = true,
  area = false,
  curved = true,
  valueFormatter,
  ...props
}: LineChartProps) {
  if (!data.length || !series.length) {
    return (
      <div className={cx('pf-chart', className)} {...props}>
        <div className="pf-chart__empty">No data</div>
      </div>
    );
  }

  const allValues = series.flatMap((s) =>
    data.map((d) => Number(d[s.key] ?? 0)),
  );
  const maxVal = Math.max(...allValues, 0);
  const yTicks = niceYTicks(maxVal);
  const maxTick = yTicks[yTicks.length - 1];
  const n = data.length;

  const resolvedSeries: ResolvedSeries[] = series.map((s, i) => ({
    ...s,
    color: resolveColor(s, i),
  }));

  return (
    <div className={cx('pf-chart', className)} {...props}>
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

          const linePath = curved
            ? smoothPath(points)
            : `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`;

          const areaPath = area
            ? `${linePath} L ${points[n - 1].x},${PAD.top + PLOT_H} L ${points[0].x},${PAD.top + PLOT_H} Z`
            : null;

          return (
            <g key={s.key}>
              {areaPath ? (
                <path
                  d={areaPath}
                  fill={s.color}
                  fillOpacity={0.12}
                  stroke="none"
                />
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

      {showLegend && resolvedSeries.length > 1 ? (
        <ChartLegend series={resolvedSeries} />
      ) : null}
    </div>
  );
}

LineChart.displayName = 'LineChart';

// ─── BarChart ─────────────────────────────────────────────────────────────

export interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: ChartDataPoint[];
  series: ChartSeries[];
  yAxisLabel?: string;
  showLegend?: boolean;
  stacked?: boolean;
  valueFormatter?: (value: number) => string;
}

export function BarChart({
  className,
  data,
  series,
  yAxisLabel,
  showLegend = true,
  stacked = false,
  valueFormatter,
  ...props
}: BarChartProps) {
  if (!data.length || !series.length) {
    return (
      <div className={cx('pf-chart', className)} {...props}>
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
  const yTicks = niceYTicks(maxVal);
  const maxTick = yTicks[yTicks.length - 1];

  const groupWidth = PLOT_W / n;
  const totalBarW = groupWidth * 0.72;
  const gap = Math.max(2, groupWidth * 0.06);
  const barW = stacked ? totalBarW : (totalBarW - gap * (m - 1)) / m;

  const resolvedSeries: ResolvedSeries[] = series.map((s, i) => ({
    ...s,
    color: resolveColor(s, i),
  }));

  return (
    <div className={cx('pf-chart', className)} {...props}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="pf-chart__svg"
        role="img"
        aria-label={yAxisLabel ?? 'Bar chart'}
      >
        <Axes
          yTicks={yTicks}
          xLabels={data.map((d) => d.label)}
          maxTick={maxTick}
          yAxisLabel={yAxisLabel}
          valueFormatter={valueFormatter}
        />

        {data.map((d, di) => {
          const groupLeft =
            PAD.left + (di + 0.5) * groupWidth - totalBarW / 2;
          let stackBase = 0;

          return (
            <g key={`group-${di}`}>
              {resolvedSeries.map((s, si) => {
                const value = Math.max(0, Number(d[s.key] ?? 0));
                const barH = (value / maxTick) * PLOT_H;
                const barX = stacked
                  ? groupLeft
                  : groupLeft + si * (barW + gap);
                const barY = stacked
                  ? toY(stackBase + value, maxTick)
                  : PAD.top + PLOT_H - barH;

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

      {showLegend && resolvedSeries.length > 1 ? (
        <ChartLegend series={resolvedSeries} />
      ) : null}
    </div>
  );
}

BarChart.displayName = 'BarChart';
