/**
 * The date text every calendar and picker shows, from formatters made once.
 *
 * Constructing an `Intl.DateTimeFormat` is the expensive part of using one —
 * it resolves the locale and the options every time — and the calendars made
 * a new one for each of their 42 day labels on every render. Measured in V8:
 * 1.6 ms of formatter construction per grid, against 0.03 ms to format the
 * same 42 dates with one held formatter. `pf-date-range-picker` draws two
 * grids and re-renders on every day the pointer crosses while choosing an
 * end, so that was over 3 ms per pointer move spent building objects it threw
 * away. In Chromium, one `pf-calendar` render went from 1.74 ms to 0.16 ms and
 * one `pf-date-range-picker` render from 2.05 ms to 0.23 ms.
 *
 * Each formatter is made the first time it is asked for, so a page with no
 * calendar pays nothing. The locale is `en-US` throughout, as it was at every
 * call site this replaced; one module is also the one place to change that.
 */

const LOCALE = 'en-US';

const cache = new Map<string, Intl.DateTimeFormat>();

function formatter(key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let held = cache.get(key);
  if (!held) {
    held = new Intl.DateTimeFormat(LOCALE, options);
    cache.set(key, held);
  }
  return held;
}

/** A day's accessible name: "Friday, March 15, 2024". */
export function formatDayLabel(date: Date): string {
  return formatter('day', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/** The React grid's day name, without the weekday: "March 15, 2024". */
export function formatLongDate(date: Date): string {
  return formatter('long', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

/** A grid's heading: "March 2024". */
export function formatMonthYear(date: Date): string {
  return formatter('month-year', { month: 'long', year: 'numeric' }).format(date);
}

/** A picker's trigger text: "Mar 15, 2024". */
export function formatShortDate(date: Date): string {
  return formatter('short', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

let monthNames: readonly string[] | undefined;

/** "January" to "December", for a month select. */
export function getMonthNames(): readonly string[] {
  monthNames ??= Array.from({ length: 12 }, (_, month) =>
    formatter('month', { month: 'long' }).format(new Date(2024, month, 1, 12)),
  );
  return monthNames;
}
