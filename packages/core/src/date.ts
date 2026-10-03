/**
 * Calendar maths, shared by `Calendar`, `DateRangePicker` and
 * `<pf-calendar>`.
 *
 * **Every date here is pinned to midday.** A date at midnight is one DST shift
 * away from being the previous day, so arithmetic on it silently loses or
 * repeats a day twice a year. Midday is far enough from both boundaries that
 * a ±1h shift cannot cross one.
 */

/** Sunday-first, matching the grid's first column. */
export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;

/** Six rows of seven, so the grid never changes height between months. */
export const CALENDAR_CELL_COUNT = 42;

export interface CalendarDay {
  date: Date;
  /** False for the leading and trailing days borrowed from the neighbours. */
  inCurrentMonth: boolean;
}

/** How a keypress moves the focused day. */
export type CalendarMove =
  | 'day-next'
  | 'day-previous'
  | 'week-next'
  | 'week-previous'
  | 'week-start'
  | 'week-end'
  | 'month-next'
  | 'month-previous'
  | 'year-next'
  | 'year-previous';

export const toMidday = (date: Date): Date => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1, 12);

export const addMonths = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);

/**
 * Adds days, through the `Date` constructor rather than by adding
 * milliseconds: the constructor normalises an out-of-range day into the next
 * month, and a millisecond offset would be wrong by an hour across a DST
 * boundary even from midday.
 */
export const addDays = (date: Date, amount: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, 12);

/** The 42 cells of a month grid, starting on the Sunday on or before the 1st. */
export const buildCalendarDays = (monthDate: Date): CalendarDay[] => {
  const monthStart = startOfMonth(monthDate);
  const gridStart = addDays(monthStart, -monthStart.getDay());

  return Array.from({ length: CALENDAR_CELL_COUNT }, (_, index) => {
    const date = addDays(gridStart, index);
    return { date, inCurrentMonth: date.getMonth() === monthDate.getMonth() };
  });
};

/**
 * Pulls a month back inside the selectable years, landing on January of the
 * first year or December of the last rather than merely clamping the year —
 * so stepping past the end stops at the last reachable month, not at the same
 * month of it.
 */
export const clampMonthToYearRange = (date: Date, startYear: number, endYear: number): Date => {
  const start = Math.min(startYear, endYear);
  const end = Math.max(startYear, endYear);
  const year = date.getFullYear();

  if (year < start) return new Date(start, 0, 1, 12);
  if (year > end) return new Date(end, 11, 1, 12);
  return date;
};

/**
 * Where a keypress moves the focused day.
 *
 * The grid pattern: left and right step a day, up and down step a week, Home
 * and End go to the ends of the focused week, and PageUp/PageDown step a
 * month. Crossing a month boundary is ordinary arithmetic here — the caller
 * decides whether that also scrolls the grid to a new month.
 *
 * Stepping a month from the 31st lands on the last day of a shorter month
 * rather than overflowing into the one after: `new Date(2024, 1, 31)` is the
 * 2nd of March, which is not what "a month after the 31st of January" means
 * in a date picker.
 */
export const moveCalendarDate = (date: Date, move: CalendarMove): Date => {
  switch (move) {
    case 'day-next':
      return addDays(date, 1);
    case 'day-previous':
      return addDays(date, -1);
    case 'week-next':
      return addDays(date, 7);
    case 'week-previous':
      return addDays(date, -7);
    case 'week-start':
      return addDays(date, -date.getDay());
    case 'week-end':
      return addDays(date, 6 - date.getDay());
    case 'month-next':
      return clampDayIntoMonth(date, date.getFullYear(), date.getMonth() + 1);
    case 'month-previous':
      return clampDayIntoMonth(date, date.getFullYear(), date.getMonth() - 1);
    case 'year-next':
      return clampDayIntoMonth(date, date.getFullYear() + 1, date.getMonth());
    case 'year-previous':
      return clampDayIntoMonth(date, date.getFullYear() - 1, date.getMonth());
  }
};

/** Keeps the day-of-month, or the last day of the target month if it is shorter. */
const clampDayIntoMonth = (date: Date, year: number, month: number): Date => {
  // Day 0 of the following month is the last day of this one.
  const lastDay = new Date(year, month + 1, 0, 12).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDay), 12);
};

/** True when `date` falls outside an inclusive min/max, either of which may be absent. */
export const isOutsideDateRange = (date: Date, min?: Date | null, max?: Date | null): boolean => {
  const day = toMidday(date).getTime();
  if (min && day < toMidday(min).getTime()) return true;
  if (max && day > toMidday(max).getTime()) return true;
  return false;
};

/**
 * Parses `YYYY-MM-DD` to a midday local date, or null.
 *
 * Deliberately not `new Date(string)`, which reads a bare `YYYY-MM-DD` as
 * **UTC** and so lands on the previous day for anyone west of Greenwich.
 */
export const parseISODate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);

  // Rejects the 31st of February, which the constructor would roll forward.
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1) return null;
  if (date.getDate() !== Number(day)) return null;

  return date;
};

/** Formats as `YYYY-MM-DD` in local time, the inverse of `parseISODate`. */
export const formatISODate = (date: Date): string => {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
