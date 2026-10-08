import { describe, expect, it } from 'vitest';
import { formatISODate, parseISODate } from './date';
import {
  formatDateRange,
  nextDateRangeSelection,
  parseDateRange,
  rangeDayState,
  type DateRangeSelection,
} from './date-range';

const d = (day: number, month = 3) => new Date(2024, month - 1, day, 12);
const iso = (date: Date | null) => (date ? formatISODate(date) : null);
const empty: DateRangeSelection = { range: { start: null, end: null }, awaitingEnd: false };

describe('nextDateRangeSelection', () => {
  it('starts the range on the first click', () => {
    const next = nextDateRangeSelection(empty, d(10));

    expect(iso(next.range.start)).toBe('2024-03-10');
    expect(next.range.end).toBeNull();
    expect(next.awaitingEnd).toBe(true);
  });

  it('closes the range on the second click', () => {
    const first = nextDateRangeSelection(empty, d(10));
    const second = nextDateRangeSelection(first, d(20));

    expect(iso(second.range.start)).toBe('2024-03-10');
    expect(iso(second.range.end)).toBe('2024-03-20');
    expect(second.awaitingEnd).toBe(false);
  });

  /* A range has no opinion about which end was picked first. */
  it('swaps the ends when the second click is earlier', () => {
    const first = nextDateRangeSelection(empty, d(20));
    const second = nextDateRangeSelection(first, d(10));

    expect(iso(second.range.start)).toBe('2024-03-10');
    expect(iso(second.range.end)).toBe('2024-03-20');
  });

  /* Clicking the start again starts over rather than making a one-day range. */
  it('restarts when the same day is clicked twice', () => {
    const first = nextDateRangeSelection(empty, d(10));
    const second = nextDateRangeSelection(first, d(10));

    expect(iso(second.range.start)).toBe('2024-03-10');
    expect(second.range.end).toBeNull();
    expect(second.awaitingEnd).toBe(true);
  });

  it('starts a new range after one is complete', () => {
    const complete = nextDateRangeSelection(nextDateRangeSelection(empty, d(10)), d(20));
    const third = nextDateRangeSelection(complete, d(25));

    expect(iso(third.range.start)).toBe('2024-03-25');
    expect(third.range.end).toBeNull();
    expect(third.awaitingEnd).toBe(true);
  });

  /* A state claiming to await an end without a start cannot close a range. */
  it('starts the range when awaitingEnd is set but there is no start', () => {
    const broken: DateRangeSelection = { range: { start: null, end: null }, awaitingEnd: true };
    const next = nextDateRangeSelection(broken, d(10));

    expect(iso(next.range.start)).toBe('2024-03-10');
    expect(next.awaitingEnd).toBe(true);
  });

  it('pins both ends to midday', () => {
    const first = nextDateRangeSelection(empty, new Date(2024, 2, 10, 23, 59));
    const second = nextDateRangeSelection(first, new Date(2024, 2, 20, 0, 1));

    expect(second.range.start?.getHours()).toBe(12);
    expect(second.range.end?.getHours()).toBe(12);
  });

  it('spans a month boundary in either direction', () => {
    const forward = nextDateRangeSelection(nextDateRangeSelection(empty, d(28, 2)), d(3, 3));
    expect([iso(forward.range.start), iso(forward.range.end)]).toEqual([
      '2024-02-28',
      '2024-03-03',
    ]);

    const backward = nextDateRangeSelection(nextDateRangeSelection(empty, d(3, 3)), d(28, 2));
    expect([iso(backward.range.start), iso(backward.range.end)]).toEqual([
      '2024-02-28',
      '2024-03-03',
    ]);
  });
});

describe('rangeDayState', () => {
  const range = { start: d(10), end: d(20) };

  it('marks the two ends', () => {
    expect(rangeDayState(d(10), range).isStart).toBe(true);
    expect(rangeDayState(d(20), range).isEnd).toBe(true);
  });

  /* Strictly inside, so an endpoint is never also "inside". */
  it('marks the days between, and neither end', () => {
    expect(rangeDayState(d(15), range).isInside).toBe(true);
    expect(rangeDayState(d(10), range).isInside).toBe(false);
    expect(rangeDayState(d(20), range).isInside).toBe(false);
  });

  it('marks nothing outside the range', () => {
    for (const day of [d(9), d(21), d(1, 4)]) {
      expect(rangeDayState(day, range)).toEqual({
        isStart: false,
        isEnd: false,
        isInside: false,
      });
    }
  });

  it('marks nothing at all for an empty range', () => {
    const state = rangeDayState(d(15), { start: null, end: null });
    expect(state).toEqual({ isStart: false, isEnd: false, isInside: false });
  });

  /* The hover preview: a hovered day stands in for the missing end. */
  it('previews a range from the hovered day while it is half-made', () => {
    const half = { start: d(10), end: null };

    expect(rangeDayState(d(15), half, d(20)).isInside).toBe(true);
    expect(rangeDayState(d(20), half, d(20)).isEnd).toBe(true);
    expect(rangeDayState(d(25), half, d(20)).isInside).toBe(false);
  });

  it('previews backwards from a hover before the start', () => {
    const half = { start: d(20), end: null };

    expect(rangeDayState(d(15), half, d(10)).isInside).toBe(true);
    expect(rangeDayState(d(10), half, d(10)).isEnd).toBe(true);
  });

  /* Hovering before the first click previews nothing. */
  it('ignores a hover when there is no start', () => {
    const state = rangeDayState(d(15), { start: null, end: null }, d(20));
    expect(state.isInside).toBe(false);
    expect(state.isEnd).toBe(false);
  });

  /* A complete range ignores the hover, or the preview would fight the value. */
  it('ignores a hover once the range is complete', () => {
    expect(rangeDayState(d(25), range, d(30)).isInside).toBe(false);
    expect(rangeDayState(d(30), range, d(30)).isEnd).toBe(false);
  });

  it('handles a hover on the start itself without marking anything inside', () => {
    const half = { start: d(10), end: null };
    const state = rangeDayState(d(10), half, d(10));

    expect(state.isStart).toBe(true);
    expect(state.isEnd).toBe(true);
    expect(state.isInside).toBe(false);
  });
});

describe('formatDateRange / parseDateRange', () => {
  it('formats a complete range', () => {
    expect(formatDateRange({ start: d(10), end: d(20) }, formatISODate)).toBe(
      '2024-03-10/2024-03-20',
    );
  });

  it('formats an incomplete range as empty', () => {
    expect(formatDateRange({ start: d(10), end: null }, formatISODate)).toBe('');
    expect(formatDateRange({ start: null, end: null }, formatISODate)).toBe('');
  });

  it('round-trips', () => {
    const parsed = parseDateRange('2024-03-10/2024-03-20', parseISODate);
    expect(formatDateRange(parsed, formatISODate)).toBe('2024-03-10/2024-03-20');
  });

  it('orders the ends it parses', () => {
    const parsed = parseDateRange('2024-03-20/2024-03-10', parseISODate);
    expect([iso(parsed.start), iso(parsed.end)]).toEqual(['2024-03-10', '2024-03-20']);
  });

  it('refuses anything incomplete or malformed', () => {
    for (const value of [
      '',
      '2024-03-10',
      '2024-03-10/',
      '/2024-03-10',
      'x/y',
      '2024-02-31/2024-03-01',
    ]) {
      expect(parseDateRange(value, parseISODate)).toEqual({ start: null, end: null });
    }
    expect(parseDateRange(null, parseISODate)).toEqual({ start: null, end: null });
  });
});
