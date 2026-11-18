import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDayLabel,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  getMonthNames,
} from './date-format';

const day = new Date(2024, 2, 15, 12);

describe('date-format', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('formats the strings the calendars show', () => {
    expect(formatDayLabel(day)).toBe('Friday, March 15, 2024');
    expect(formatLongDate(day)).toBe('March 15, 2024');
    expect(formatMonthYear(day)).toBe('March 2024');
    expect(formatShortDate(day)).toBe('Mar 15, 2024');
    expect(getMonthNames()).toEqual([
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
  });

  /*
   * The point of the module. A fresh formatter per call is what the
   * calendars did, 42 times a render; constructing one is the expensive part.
   */
  it('builds no formatter after the first use of each', async () => {
    // A fresh copy of the module, so earlier tests have not warmed it.
    vi.resetModules();
    const fresh = await import('./date-format');
    const Real = Intl.DateTimeFormat;
    let built = 0;
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(function (
      ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
    ) {
      built += 1;
      return new Real(...args);
    } as unknown as typeof Intl.DateTimeFormat);

    for (let i = 0; i < 42; i += 1) {
      fresh.formatDayLabel(new Date(2024, 2, i + 1, 12));
      fresh.formatLongDate(day);
      fresh.formatMonthYear(day);
      fresh.formatShortDate(day);
      fresh.getMonthNames();
    }

    expect(built).toBe(5);
  });
});
