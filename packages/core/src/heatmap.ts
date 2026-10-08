/**
 * The grid behind a calendar heatmap: which days it covers, which column each
 * week is, and how dark a value makes a cell.
 *
 * Shared because all of it is date arithmetic and bucketing, and because the
 * date arithmetic is the part that is easy to get wrong in a way nobody sees
 * until a daylight-saving boundary. It goes through `date.ts`, which pins
 * every date to midday for exactly that reason.
 */
import { addDays, formatISODate, parseISODate, toMidday } from './date';

/** Short month names, in the order a `Date` reports them. */
export const HEATMAP_MONTHS: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Short weekday names, Sunday first, as `Date.getDay()` numbers them. */
export const HEATMAP_WEEKDAYS: readonly string[] = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

/** What a heatmap needs of a datum. */
export interface HeatmapDatumLike {
  /** `YYYY-MM-DD`. */
  date: string;
  value: number;
}

export interface HeatmapCell {
  /** `YYYY-MM-DD`, which is also the key a value is looked up by. */
  iso: string;
  date: Date;
  /** False for the days padding the first and last weeks. */
  inRange: boolean;
}

/**
 * The first and last day to draw.
 *
 * The explicit bounds win; otherwise the earliest and latest dates in the
 * data. `null` when there is nothing to draw, which is the caller's signal to
 * show its empty state. A date that does not parse is ignored rather than
 * becoming an `Invalid Date` that poisons every comparison after it.
 */
export function heatmapRange(
  data: readonly HeatmapDatumLike[],
  startDate?: string,
  endDate?: string,
): { start: Date; end: Date } | null {
  const dates = data
    .map((item) => item.date)
    .filter((iso) => parseISODate(iso) !== null)
    .sort();

  const start = parseISODate(startDate ?? dates[0]);
  const end = parseISODate(endDate ?? dates[dates.length - 1]);
  if (!start || !end) return null;
  if (end < start) return null;

  return { start, end };
}

/**
 * The weeks to draw, as columns of seven days.
 *
 * The first column is aligned back to the configured week start, so every row
 * is the same weekday all the way across — which is the whole point of the
 * shape. Days before `start` and after `end` are present but not `inRange`,
 * because the grid has to stay rectangular.
 *
 * Capped at 400 columns: a `start`/`end` pair a consumer got the wrong way
 * round is caught by `heatmapRange`, but a range of twenty years is a
 * legitimate pair of dates and an unbounded loop building 1,040 columns of
 * seven cells each is a frozen tab rather than a chart.
 */
export function buildHeatmapWeeks(
  start: Date,
  end: Date,
  weekStartsOn: 0 | 1 = 0,
): HeatmapCell[][] {
  const from = toMidday(start);
  const to = toMidday(end);
  const offset = (from.getDay() - weekStartsOn + 7) % 7;

  const weeks: HeatmapCell[][] = [];
  let cursor = addDays(from, -offset);

  while (cursor <= to && weeks.length < 400) {
    const week: HeatmapCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      week.push({
        iso: formatISODate(cursor),
        date: cursor,
        inRange: cursor >= from && cursor <= to,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

/**
 * The largest and the sum of the values, ignoring the ones that are not
 * numbers.
 *
 * The React `Heatmap` reduced with `Math.max(max, d.value)` and `sum +
 * d.value`, both of which carry one `NaN` through everything: every cell's
 * level came out `NaN` and the accessible summary read "NaN total".
 */
export function summariseHeatmap(data: readonly HeatmapDatumLike[]): {
  max: number;
  total: number;
} {
  let max = 0;
  let total = 0;
  for (const item of data) {
    if (!Number.isFinite(item.value)) continue;
    max = Math.max(max, item.value);
    total += item.value;
  }
  return { max, total };
}

/**
 * Which bucket a value falls in, from `0` (nothing) to `levelCount - 1`.
 *
 * Level 0 is reserved for "no activity", so any positive value is at least 1
 * however small — a day with one commit should not look like a day with none.
 */
export function heatmapLevel(value: number, max: number, levelCount: number): number {
  const levels = Math.max(2, Math.floor(levelCount) || 2);
  if (!Number.isFinite(value) || value <= 0 || !(max > 0)) return 0;

  return Math.min(levels - 1, Math.max(1, Math.ceil((value / max) * (levels - 1))));
}

/**
 * The colour for a level, as a `color-mix` of the heatmap's own two aliases.
 *
 * A mix rather than a scale of tokens, so one `--pf-heatmap-color` override
 * re-tints the whole chart.
 */
export function heatmapCellColor(level: number, levelCount: number): string {
  if (level <= 0) return 'var(--pf-heatmap-empty)';

  const levels = Math.max(2, Math.floor(levelCount) || 2);
  const percent = Math.round((Math.min(level, levels - 1) / (levels - 1)) * 100);
  return `color-mix(in srgb, var(--pf-heatmap-color) ${percent}%, var(--pf-heatmap-empty))`;
}

/**
 * Where each month's name goes: the column of the first in-range day that
 * belongs to it.
 *
 * `column` is one-based, because it is used as a `grid-column-start`.
 */
export function heatmapMonthLabels(
  weeks: readonly HeatmapCell[][],
): { column: number; label: string }[] {
  const labels: { column: number; label: string }[] = [];
  let lastMonth = -1;

  for (const [index, week] of weeks.entries()) {
    const first = week.find((cell) => cell.inRange);
    if (!first) continue;

    const month = first.date.getMonth();
    if (month !== lastMonth) {
      labels.push({ column: index + 1, label: HEATMAP_MONTHS[month] });
      lastMonth = month;
    }
  }

  return labels;
}
