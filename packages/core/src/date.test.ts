import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  buildCalendarDays,
  CALENDAR_CELL_COUNT,
  clampMonthToYearRange,
  formatISODate,
  isOutsideDateRange,
  isSameDay,
  isSameMonth,
  moveCalendarDate,
  parseISODate,
  startOfMonth,
  toMidday,
  WEEKDAY_LABELS,
} from './date';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day, 12);
const iso = (date: Date) => formatISODate(date);

describe('toMidday', () => {
  it('pins the clock to noon and leaves the day alone', () => {
    const result = toMidday(new Date(2024, 2, 10, 23, 59, 59, 999));
    expect(result.getHours()).toBe(12);
    expect(result.getDate()).toBe(10);
    expect(result.getMinutes()).toBe(0);
  });

  it('does not mutate what it is given', () => {
    const original = new Date(2024, 2, 10, 23, 0, 0);
    toMidday(original);
    expect(original.getHours()).toBe(23);
  });
});

describe('isSameDay / isSameMonth', () => {
  it('compares the calendar day, not the instant', () => {
    expect(isSameDay(new Date(2024, 2, 10, 0, 1), new Date(2024, 2, 10, 23, 59))).toBe(true);
  });

  it('separates the same day number in different months and years', () => {
    expect(isSameDay(d(2024, 3, 10), d(2024, 4, 10))).toBe(false);
    expect(isSameDay(d(2024, 3, 10), d(2025, 3, 10))).toBe(false);
    expect(isSameMonth(d(2024, 3, 1), d(2024, 3, 31))).toBe(true);
    expect(isSameMonth(d(2024, 3, 31), d(2025, 3, 1))).toBe(false);
  });
});

describe('addDays', () => {
  it('rolls into the next month', () => {
    expect(iso(addDays(d(2024, 1, 31), 1))).toBe('2024-02-01');
  });

  it('rolls back into the previous year', () => {
    expect(iso(addDays(d(2024, 1, 1), -1))).toBe('2023-12-31');
  });

  it('knows February has 29 days in a leap year', () => {
    expect(iso(addDays(d(2024, 2, 28), 1))).toBe('2024-02-29');
    expect(iso(addDays(d(2023, 2, 28), 1))).toBe('2023-03-01');
  });

  /*
   * The reason everything is at midday. Adding 86_400_000ms across a DST
   * boundary lands an hour out, which from midnight is the previous day.
   * March 10th 2024 is the US spring-forward; October 27th is the EU autumn
   * one. Whatever zone the test runs in, a day step must change the date by
   * exactly one.
   */
  it('steps exactly one day across a DST boundary', () => {
    for (const start of [d(2024, 3, 9), d(2024, 3, 10), d(2024, 10, 26), d(2024, 10, 27)]) {
      const next = addDays(start, 1);
      const back = addDays(next, -1);
      expect(next.getDate()).not.toBe(start.getDate());
      expect(iso(back)).toBe(iso(start));
      expect(next.getHours()).toBe(12);
    }
  });
});

describe('startOfMonth / addMonths', () => {
  it('goes to the 1st at midday', () => {
    const result = startOfMonth(d(2024, 7, 23));
    expect(iso(result)).toBe('2024-07-01');
    expect(result.getHours()).toBe(12);
  });

  it('crosses the year in both directions', () => {
    expect(iso(addMonths(d(2024, 12, 15), 1))).toBe('2025-01-01');
    expect(iso(addMonths(d(2024, 1, 15), -1))).toBe('2023-12-01');
  });
});

describe('buildCalendarDays', () => {
  it('always returns six weeks, so the grid never changes height', () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(buildCalendarDays(d(2024, month, 1))).toHaveLength(CALENDAR_CELL_COUNT);
    }
  });

  it('starts on a Sunday and runs 42 consecutive days', () => {
    const days = buildCalendarDays(d(2024, 3, 1));
    expect(days[0].date.getDay()).toBe(0);

    for (let index = 1; index < days.length; index += 1) {
      expect(iso(days[index].date)).toBe(iso(addDays(days[index - 1].date, 1)));
    }
  });

  it('marks exactly the days of the month it was asked for', () => {
    const days = buildCalendarDays(d(2024, 2, 1));
    const inMonth = days.filter((day) => day.inCurrentMonth);
    expect(inMonth).toHaveLength(29); // 2024 is a leap year
    expect(iso(inMonth[0].date)).toBe('2024-02-01');
    expect(iso(inMonth[inMonth.length - 1].date)).toBe('2024-02-29');
  });

  /* A month starting on a Sunday has no leading borrowed days. */
  it('borrows no leading days when the 1st is a Sunday', () => {
    const days = buildCalendarDays(d(2024, 9, 1));
    expect(d(2024, 9, 1).getDay()).toBe(0);
    expect(days[0].inCurrentMonth).toBe(true);
  });

  /*
   * Six rows is not always enough in principle — a 31-day month starting on a
   * Saturday needs exactly six — so check every month over a long span really
   * does fit, rather than assuming it.
   */
  it('fits every month of a 12-year span inside six weeks', () => {
    for (let year = 2020; year <= 2032; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        const days = buildCalendarDays(d(year, month, 1));
        const inMonth = days.filter((day) => day.inCurrentMonth);
        const lastOfMonth = new Date(year, month, 0, 12).getDate();
        expect(inMonth).toHaveLength(lastOfMonth);
      }
    }
  });

  it('labels seven weekday columns, starting on Sunday', () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(WEEKDAY_LABELS[0]).toBe('Su');
  });
});

describe('clampMonthToYearRange', () => {
  it('leaves a month inside the range alone', () => {
    expect(iso(clampMonthToYearRange(d(2024, 6, 1), 2020, 2030))).toBe('2024-06-01');
  });

  /* January of the first year and December of the last, not the same month. */
  it('lands on the first reachable month when it is too early', () => {
    expect(iso(clampMonthToYearRange(d(2010, 6, 1), 2020, 2030))).toBe('2020-01-01');
  });

  it('lands on the last reachable month when it is too late', () => {
    expect(iso(clampMonthToYearRange(d(2040, 6, 1), 2020, 2030))).toBe('2030-12-01');
  });

  it('tolerates the bounds being given the wrong way round', () => {
    expect(iso(clampMonthToYearRange(d(2010, 6, 1), 2030, 2020))).toBe('2020-01-01');
  });

  it('handles a single-year range', () => {
    expect(iso(clampMonthToYearRange(d(2010, 6, 1), 2024, 2024))).toBe('2024-01-01');
    expect(iso(clampMonthToYearRange(d(2040, 6, 1), 2024, 2024))).toBe('2024-12-01');
  });
});

describe('moveCalendarDate', () => {
  it('steps a day sideways and a week vertically', () => {
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'day-next'))).toBe('2024-03-16');
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'day-previous'))).toBe('2024-03-14');
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'week-next'))).toBe('2024-03-22');
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'week-previous'))).toBe('2024-03-08');
  });

  it('goes to the ends of the focused week', () => {
    // 2024-03-15 is a Friday.
    expect(d(2024, 3, 15).getDay()).toBe(5);
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'week-start'))).toBe('2024-03-10');
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'week-end'))).toBe('2024-03-16');
  });

  it('leaves a Sunday where it is on week-start', () => {
    expect(iso(moveCalendarDate(d(2024, 3, 10), 'week-start'))).toBe('2024-03-10');
  });

  it('crosses a month boundary as ordinary arithmetic', () => {
    expect(iso(moveCalendarDate(d(2024, 3, 31), 'day-next'))).toBe('2024-04-01');
    expect(iso(moveCalendarDate(d(2024, 3, 1), 'day-previous'))).toBe('2024-02-29');
  });

  it('steps a month and a year', () => {
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'month-next'))).toBe('2024-04-15');
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'month-previous'))).toBe('2024-02-15');
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'year-next'))).toBe('2025-03-15');
    expect(iso(moveCalendarDate(d(2024, 3, 15), 'year-previous'))).toBe('2023-03-15');
  });

  /*
   * A month after the 31st of January is the end of February, not the 2nd of
   * March. `new Date(2024, 1, 31)` would give the latter.
   */
  it('clamps into a shorter month rather than overflowing past it', () => {
    expect(iso(moveCalendarDate(d(2024, 1, 31), 'month-next'))).toBe('2024-02-29');
    expect(iso(moveCalendarDate(d(2023, 1, 31), 'month-next'))).toBe('2023-02-28');
    expect(iso(moveCalendarDate(d(2024, 3, 31), 'month-previous'))).toBe('2024-02-29');
    expect(iso(moveCalendarDate(d(2024, 2, 29), 'year-next'))).toBe('2025-02-28');
  });

  it('keeps every move at midday', () => {
    const moves = [
      'day-next',
      'day-previous',
      'week-next',
      'week-previous',
      'week-start',
      'week-end',
      'month-next',
      'month-previous',
      'year-next',
      'year-previous',
    ] as const;

    for (const move of moves) {
      expect(moveCalendarDate(d(2024, 3, 10), move).getHours()).toBe(12);
    }
  });

  /* Left then right is a round trip, from every day of a month. */
  it('is reversible day by day across a whole month', () => {
    for (let day = 1; day <= 31; day += 1) {
      const start = d(2024, 3, day);
      expect(iso(moveCalendarDate(moveCalendarDate(start, 'day-next'), 'day-previous'))).toBe(
        iso(start),
      );
    }
  });
});

describe('isOutsideDateRange', () => {
  it('is false with no bounds at all', () => {
    expect(isOutsideDateRange(d(2024, 3, 15))).toBe(false);
  });

  it('is inclusive at both ends', () => {
    expect(isOutsideDateRange(d(2024, 3, 1), d(2024, 3, 1), d(2024, 3, 31))).toBe(false);
    expect(isOutsideDateRange(d(2024, 3, 31), d(2024, 3, 1), d(2024, 3, 31))).toBe(false);
  });

  it('catches a day on either side', () => {
    expect(isOutsideDateRange(d(2024, 2, 29), d(2024, 3, 1), d(2024, 3, 31))).toBe(true);
    expect(isOutsideDateRange(d(2024, 4, 1), d(2024, 3, 1), d(2024, 3, 31))).toBe(true);
  });

  it('works with only one bound', () => {
    expect(isOutsideDateRange(d(2024, 1, 1), d(2024, 3, 1), null)).toBe(true);
    expect(isOutsideDateRange(d(2024, 6, 1), d(2024, 3, 1), null)).toBe(false);
    expect(isOutsideDateRange(d(2024, 6, 1), null, d(2024, 3, 31))).toBe(true);
  });

  /* Compared by day, so a bound given at another time of day still works. */
  it('ignores the time of day on the bounds', () => {
    const min = new Date(2024, 2, 1, 23, 59);
    expect(isOutsideDateRange(new Date(2024, 2, 1, 0, 1), min, null)).toBe(false);
  });
});

describe('parseISODate / formatISODate', () => {
  it('reads a date as local, not UTC', () => {
    const parsed = parseISODate('2024-03-15');
    expect(parsed?.getFullYear()).toBe(2024);
    expect(parsed?.getMonth()).toBe(2);
    // The whole point: `new Date('2024-03-15')` is UTC midnight, which is the
    // 14th for anyone west of Greenwich.
    expect(parsed?.getDate()).toBe(15);
  });

  it('round-trips', () => {
    for (const value of ['2024-01-01', '2024-02-29', '2024-12-31', '1999-06-07']) {
      expect(formatISODate(parseISODate(value)!)).toBe(value);
    }
  });

  it('pads single-digit months and days', () => {
    expect(formatISODate(d(2024, 1, 5))).toBe('2024-01-05');
  });

  it('rejects anything that is not YYYY-MM-DD', () => {
    for (const value of ['', '  ', 'today', '2024-3-15', '15/03/2024', '2024-03-15T10:00']) {
      expect(parseISODate(value)).toBeNull();
    }
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate(undefined)).toBeNull();
  });

  /* The constructor would roll these forward rather than refusing them. */
  it('rejects a day that does not exist', () => {
    expect(parseISODate('2023-02-29')).toBeNull();
    expect(parseISODate('2024-02-31')).toBeNull();
    expect(parseISODate('2024-13-01')).toBeNull();
    expect(parseISODate('2024-00-10')).toBeNull();
  });

  it('accepts the 29th of February in a leap year', () => {
    expect(formatISODate(parseISODate('2024-02-29')!)).toBe('2024-02-29');
  });

  it('tolerates surrounding whitespace', () => {
    expect(formatISODate(parseISODate('  2024-03-15  ')!)).toBe('2024-03-15');
  });
});
