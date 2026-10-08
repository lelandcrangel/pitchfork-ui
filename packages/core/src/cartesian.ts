/**
 * The scales and paths behind a line, area or bar chart: where the axis ticks
 * fall, where a value lands in the plot, and the paths drawn through those
 * points.
 *
 * Shared because the axis labels and the geometry have to come from the same
 * tick scale — a chart whose gridlines say 40 and whose line peaks at
 * three-quarters height is worse than one with no gridlines — and because
 * both layers draw the same two chart types.
 */
import { CHART_SERIES_COLORS } from './pie';

/** The viewBox both chart types draw into, and the room left for the axes. */
export const CHART_VIEW = { width: 560, height: 240 } as const;
export const CHART_PADDING = { top: 24, right: 32, bottom: 40, left: 56 } as const;

export const CHART_PLOT = {
  width: CHART_VIEW.width - CHART_PADDING.left - CHART_PADDING.right,
  height: CHART_VIEW.height - CHART_PADDING.top - CHART_PADDING.bottom,
} as const;

export interface ChartPoint {
  x: number;
  y: number;
}

/** The colour for a series: the one it asked for, or the palette's. */
export function chartSeriesColor(index: number, override?: string): string {
  return override ?? CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length];
}

/**
 * Axis ticks a person would have chosen: `0` upwards in steps of 1, 2, 2.5 or
 * 5 times a power of ten, ending at or just above the largest value.
 *
 * Three things the React version got wrong, all of them in the arithmetic
 * rather than in the idea:
 *
 * - A `maxValue` that is not a number fell through the `<= 0` guard, made
 *   `step` `NaN`, and so produced an **empty** array — after which
 *   `ticks[ticks.length - 1]` was `undefined`, the whole chart's `maxTick`
 *   was `undefined`, and every coordinate came out `NaN`.
 * - The ticks were accumulated with `v += step`, which drifts: a step of
 *   `0.1` gave `0.30000000000000004` as an axis label. They are multiplied
 *   out from the index instead.
 * - An `Infinity` maximum looped on a step of `Infinity`.
 */
export function niceAxisTicks(maxValue: number, count = 5): number[] {
  const fallback = [0, 1, 2, 3, 4, 5];
  if (!Number.isFinite(maxValue) || maxValue <= 0) return fallback;

  const rough = maxValue / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= rough) ?? 10) * magnitude;
  if (!(step > 0)) return fallback;

  /*
   * Multiplied out rather than accumulated, and the count worked out up
   * front: `Math.ceil` with a hair of tolerance so a maximum that lands
   * exactly on a tick does not add an empty one above it.
   */
  const steps = Math.max(1, Math.ceil(maxValue / step - 1e-9));
  return Array.from({ length: steps + 1 }, (_, index) => Number((index * step).toPrecision(12)));
}

/**
 * A tick as a person reads it: `1.5k`, `2M`, `940`, `0.25`.
 *
 * In core because the axis and the hover title have to agree, and because two
 * layers abbreviating differently would show the same number two ways in one
 * chart.
 *
 * The fractional branch is the fix: the React version ended in
 * `String(Math.round(value))`, so **every** tick on an axis that tops out
 * below 1 printed as `0` — a chart of conversion rates had six gridlines all
 * labelled zero. Below 1 the value is shown to two significant figures with
 * trailing zeros trimmed, which is what `Number(toPrecision(2))` gives.
 */
export function formatAxisTick(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const magnitude = Math.abs(value);

  if (magnitude >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (magnitude >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  if (magnitude > 0 && magnitude < 1) return String(Number(value.toPrecision(2)));
  return String(Math.round(value));
}

/** Where a value sits vertically: the plot's floor at 0, its ceiling at `maxTick`. */
export function plotY(value: number, maxTick: number): number {
  const top = maxTick > 0 ? maxTick : 1;
  const safe = Number.isFinite(value) ? value : 0;
  return CHART_PADDING.top + CHART_PLOT.height - (safe / top) * CHART_PLOT.height;
}

/**
 * Where the nth of `count` points sits horizontally.
 *
 * A single point goes in the middle: `index / (count - 1)` divides by zero
 * there, which is the same trap `sparklinePoints` exists to avoid.
 */
export function plotX(index: number, count: number): number {
  if (count <= 1) return CHART_PADDING.left + CHART_PLOT.width / 2;
  return CHART_PADDING.left + (index / (count - 1)) * CHART_PLOT.width;
}

/** A straight line through the points. */
export function straightSeriesPath(points: readonly ChartPoint[]): string {
  if (points.length === 0) return '';
  return `M ${points.map((point) => `${point.x},${point.y}`).join(' L ')}`;
}

/**
 * A smooth line through the points, as cubic beziers.
 *
 * Catmull-Rom with the usual sixth-of-the-span control points, which passes
 * *through* every point rather than near it — a chart whose line misses its
 * own dots is a chart nobody trusts.
 */
export function smoothSeriesPath(points: readonly ChartPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) return straightSeriesPath(points);

  const round = (value: number) => Number(value.toFixed(2));
  let path = `M ${points[0].x},${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const before = points[Math.max(0, index - 1)];
    const from = points[index];
    const to = points[index + 1];
    const after = points[Math.min(points.length - 1, index + 2)];

    const c1x = round(from.x + (to.x - before.x) / 6);
    const c1y = round(from.y + (to.y - before.y) / 6);
    const c2x = round(to.x - (after.x - from.x) / 6);
    const c2y = round(to.y - (after.y - from.y) / 6);

    path += ` C ${c1x},${c1y} ${c2x},${c2y} ${to.x},${to.y}`;
  }

  return path;
}

/** The same line closed down to the plot's floor, for the filled variant. */
export function areaSeriesPath(line: string, points: readonly ChartPoint[]): string {
  if (!line || points.length === 0) return '';

  const floor = CHART_PADDING.top + CHART_PLOT.height;
  const last = points[points.length - 1];
  return `${line} L ${last.x},${floor} L ${points[0].x},${floor} Z`;
}

export interface BarGeometry {
  /** The width each group of bars gets. */
  groupWidth: number;
  /** One bar's width. */
  barWidth: number;
  /** The space between bars within a group. */
  gap: number;
  /** The left edge of each group's bars. */
  groupLefts: number[];
  /** The centre of each group, which is where its x-axis label goes. */
  groupCenters: number[];
}

/**
 * How wide the bars are and where each group starts.
 *
 * `barWidth` is floored at 1: with enough series,
 * `(total - gap * (m - 1)) / m` goes **negative**, and a negative `width` on
 * a `<rect>` is an error the browser drops the element for — so a chart of
 * twelve series silently lost its bars.
 */
export function barGeometry(groups: number, seriesCount: number, stacked: boolean): BarGeometry {
  const count = Math.max(1, Math.floor(groups) || 1);
  const series = Math.max(1, Math.floor(seriesCount) || 1);

  const groupWidth = CHART_PLOT.width / count;
  const totalWidth = groupWidth * 0.72;
  const gap = Math.max(2, groupWidth * 0.06);
  const barWidth = stacked ? totalWidth : Math.max(1, (totalWidth - gap * (series - 1)) / series);

  const groupCenters = Array.from(
    { length: count },
    (_, index) => CHART_PADDING.left + (index + 0.5) * groupWidth,
  );

  return {
    groupWidth,
    barWidth,
    gap,
    groupLefts: groupCenters.map((center) => center - totalWidth / 2),
    groupCenters,
  };
}

/**
 * How often to print an x-axis label.
 *
 * Every label on a long series overlaps itself into a grey smear, so a chart
 * of forty points prints every fourth. Twelve is as many as fit across the
 * plot at the tick font size.
 */
export function axisLabelStep(count: number, maximumLabels = 12): number {
  return Math.max(1, Math.ceil(count / Math.max(1, maximumLabels)));
}
