/**
 * The arithmetic behind a pie or donut: which slices there are, how big each
 * one is, and the gradient that draws them.
 *
 * Shared because the numbers in the legend and the angles in the chart have to
 * agree, and because two layers rounding percentages differently would show
 * the same data as two different breakdowns.
 */

/**
 * The series palette, as the names of the theme's own aliases.
 *
 * Names rather than values, so a slice picks up the theme's dark-mode shift,
 * and in core rather than in each layer so the first slice is the same colour
 * in a pie, a bar and a line for the same series.
 */
export const CHART_SERIES_COLORS: readonly string[] = [
  'var(--pf-chart-color-1)',
  'var(--pf-chart-color-2)',
  'var(--pf-chart-color-3)',
  'var(--pf-chart-color-4)',
  'var(--pf-chart-color-5)',
  'var(--pf-chart-color-6)',
];

/** What a pie needs of a datum. */
export interface PieDatumLike {
  value: number;
  color?: string;
}

export interface PieSegment {
  /** Where in the original data this slice came from, for labels and keys. */
  index: number;
  value: number;
  color: string;
  /** Share of the total, 0–100, unrounded. */
  percentage: number;
}

/**
 * The slices worth drawing, in order.
 *
 * Non-positive values are dropped — a zero slice is a legend entry, not a
 * wedge — and a value that is not a number goes with them, since `NaN > 0` is
 * false.
 *
 * The part that matters is the **order**: filter first, then total. The React
 * `PieChart` totalled the unfiltered list, so one `NaN` made the total `NaN`,
 * slipped past a `total <= 0` guard that `NaN` does not satisfy, and left
 * every *surviving* slice with a percentage of `NaN` — an invalid
 * `conic-gradient` and a chart that drew blank. Measured by putting the two
 * steps back in the wrong order, which fails two tests here and one in the
 * React layer; the `Number.isFinite` guard on its own changes nothing, which
 * is how the order was identified as the fix.
 *
 * Empty when nothing is left, which is the caller's signal to show its empty
 * state rather than a chart of nothing.
 */
export function preparePieSegments(data: readonly PieDatumLike[]): PieSegment[] {
  const usable = data
    .map((item, index) => ({
      index,
      value: Number.isFinite(item.value) ? Math.max(item.value, 0) : 0,
      color: item.color ?? CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length],
    }))
    .filter((item) => item.value > 0);

  const total = usable.reduce((sum, item) => sum + item.value, 0);
  if (!(total > 0)) return [];

  return usable.map((item) => ({ ...item, percentage: (item.value / total) * 100 }));
}

/**
 * Whole percentages that sum to exactly 100.
 *
 * Largest remainder: floor everything, then give the leftover points to the
 * slices that lost the most by being floored. Rounding each slice on its own —
 * which is what both layers did in their legends — shows three equal thirds as
 * "33%, 33%, 33%" and three slices of 16.7 as "17%, 17%, 17%", so a reader is
 * invited to notice that the breakdown does not add up.
 */
export function roundPercentages(percentages: readonly number[]): number[] {
  const floors = percentages.map((value) => Math.floor(value));
  const used = floors.reduce((sum, value) => sum + value, 0);
  let leftover = Math.round(percentages.reduce((sum, value) => sum + value, 0)) - used;

  const order = percentages
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  const result = [...floors];
  for (const { index } of order) {
    if (leftover <= 0) break;
    result[index] += 1;
    leftover -= 1;
  }
  return result;
}

/**
 * A `conic-gradient` with one hard stop per slice.
 *
 * Hard stops — each slice's end is the next one's start — because a gradient
 * with soft stops would blend the slices into each other, which is a different
 * chart.
 */
export function pieConicGradient(segments: readonly PieSegment[]): string {
  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    cursor += segment.percentage;
    return `${segment.color} ${start}% ${cursor}%`;
  });

  return `conic-gradient(${stops.join(', ')})`;
}

/**
 * The hole in the middle, as a fraction of the diameter.
 *
 * Capped below 1 because a cutout of 1 is a chart with no chart in it, and
 * 0.88 is where the ring stops being readable.
 */
export function clampPieCutout(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 0.88);
}
