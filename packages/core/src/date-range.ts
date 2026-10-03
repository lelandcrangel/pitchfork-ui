import { isSameDay, toMidday } from './date';

/**
 * The range-selection state machine and day states, shared by
 * `DateRangePicker` and `<pf-date-range-picker>`.
 *
 * Both halves are here because both are rules rather than rendering: which
 * click does what, and which days read as inside the range. A second copy
 * would diverge the first time either is corrected, and silently — each
 * layer's own tests would still pass.
 */

export interface DateRangeValue {
  start: Date | null;
  end: Date | null;
}

export interface DateRangeSelection {
  range: DateRangeValue;
  /** True when the next click sets the end rather than restarting. */
  awaitingEnd: boolean;
}

export interface RangeDayState {
  isStart: boolean;
  isEnd: boolean;
  /** Strictly between the two ends, so an endpoint is never also "inside". */
  isInside: boolean;
}

/**
 * Where a click on `date` leaves the selection.
 *
 * Three cases, and the second two are the ones worth naming:
 * - not awaiting an end: start the range here and wait for the other end;
 * - awaiting an end, clicked before the start: the two swap, because a range
 *   has no opinion about which end the user picked first;
 * - awaiting an end, clicked the start again: start over rather than make a
 *   one-day range, which is what the React component does and is the kinder
 *   reading of a double click.
 */
export function nextDateRangeSelection(
  current: DateRangeSelection,
  date: Date,
): DateRangeSelection {
  const clicked = toMidday(date);

  if (!current.awaitingEnd || !current.range.start) {
    return { range: { start: clicked, end: null }, awaitingEnd: true };
  }

  const start = current.range.start;

  if (isSameDay(start, clicked)) {
    return { range: { start: clicked, end: null }, awaitingEnd: true };
  }

  const reversed = clicked.getTime() < start.getTime();
  return {
    range: reversed ? { start: clicked, end: start } : { start, end: clicked },
    awaitingEnd: false,
  };
}

/**
 * How a day should read, given the range and whatever is hovered.
 *
 * A hovered day stands in for the missing end while the range is half-made,
 * which is what makes the preview follow the pointer. It stands in only when
 * there is a start and no end — hovering before the first click previews
 * nothing.
 */
export function rangeDayState(
  date: Date,
  range: DateRangeValue,
  hovered: Date | null = null,
): RangeDayState {
  const { start } = range;
  const end = range.end ?? (start && hovered ? hovered : null);

  const isStart = Boolean(start && isSameDay(date, start));
  const isEnd = Boolean(end && isSameDay(date, end));

  if (!start || !end) return { isStart, isEnd, isInside: false };

  const [low, high] = start.getTime() <= end.getTime() ? [start, end] : [end, start];
  const day = date.getTime();

  return { isStart, isEnd, isInside: day > low.getTime() && day < high.getTime() };
}

/** `YYYY-MM-DD/YYYY-MM-DD`, or `''` when the range is not yet complete. */
export function formatDateRange(range: DateRangeValue, format: (date: Date) => string): string {
  if (!range.start || !range.end) return '';
  return `${format(range.start)}/${format(range.end)}`;
}

/** Parses `YYYY-MM-DD/YYYY-MM-DD`; anything else is an empty range. */
export function parseDateRange(
  value: string | null | undefined,
  parse: (value: string) => Date | null,
): DateRangeValue {
  const [from, to] = (value ?? '').split('/');
  const start = parse(from ?? '');
  const end = parse(to ?? '');
  if (!start || !end) return { start: null, end: null };
  return start.getTime() <= end.getTime() ? { start, end } : { start: end, end: start };
}
