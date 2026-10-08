import { describe, expect, it } from 'vitest';
import {
  formatTimeDisplay,
  formatTimeValue,
  hourOptions,
  meridiemOf,
  padTimePart,
  parseTimeValue,
  timeRange,
  toHour12,
  toHour24,
} from './time';

describe('parseTimeValue', () => {
  it('reads HH:mm and H:mm', () => {
    expect(parseTimeValue('14:30')).toEqual({ hour: 14, minute: 30 });
    expect(parseTimeValue('9:05')).toEqual({ hour: 9, minute: 5 });
  });

  it('reads both ends of the day', () => {
    expect(parseTimeValue('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(parseTimeValue('23:59')).toEqual({ hour: 23, minute: 59 });
  });

  /* Rejected rather than wrapped: 25:00 is a mistake, not 1am. */
  it('refuses out-of-range parts', () => {
    expect(parseTimeValue('24:00')).toEqual({ hour: null, minute: null });
    expect(parseTimeValue('25:00')).toEqual({ hour: null, minute: null });
    expect(parseTimeValue('12:60')).toEqual({ hour: null, minute: null });
  });

  it('refuses anything that is not a time', () => {
    for (const value of ['', '  ', 'noon', '1430', '14:3', '14:30:00', '2:30 PM']) {
      expect(parseTimeValue(value)).toEqual({ hour: null, minute: null });
    }
    expect(parseTimeValue(null)).toEqual({ hour: null, minute: null });
    expect(parseTimeValue(undefined)).toEqual({ hour: null, minute: null });
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseTimeValue('  14:30  ')).toEqual({ hour: 14, minute: 30 });
  });
});

describe('formatTimeValue', () => {
  it('pads both parts', () => {
    expect(formatTimeValue({ hour: 9, minute: 5 })).toBe('09:05');
    expect(formatTimeValue({ hour: 0, minute: 0 })).toBe('00:00');
  });

  it('is empty when either part is missing', () => {
    expect(formatTimeValue({ hour: null, minute: 30 })).toBe('');
    expect(formatTimeValue({ hour: 14, minute: null })).toBe('');
  });

  it('round-trips with parseTimeValue', () => {
    for (const value of ['00:00', '09:05', '14:30', '23:59']) {
      expect(formatTimeValue(parseTimeValue(value))).toBe(value);
    }
  });
});

describe('formatTimeDisplay', () => {
  it('shows a 24-hour clock as given', () => {
    expect(formatTimeDisplay({ hour: 14, minute: 30 }, 24)).toBe('14:30');
    expect(formatTimeDisplay({ hour: 0, minute: 0 }, 24)).toBe('00:00');
  });

  it('shows a 12-hour clock with a meridiem', () => {
    expect(formatTimeDisplay({ hour: 14, minute: 30 }, 12)).toBe('2:30 PM');
    expect(formatTimeDisplay({ hour: 9, minute: 5 }, 12)).toBe('9:05 AM');
  });

  /* The two the modulo gets wrong: both faces read 12, not 0. */
  it('shows midnight and midday as 12', () => {
    expect(formatTimeDisplay({ hour: 0, minute: 0 }, 12)).toBe('12:00 AM');
    expect(formatTimeDisplay({ hour: 12, minute: 0 }, 12)).toBe('12:00 PM');
  });

  it('is empty with no value, on either cycle', () => {
    expect(formatTimeDisplay({ hour: null, minute: null }, 12)).toBe('');
    expect(formatTimeDisplay({ hour: null, minute: null }, 24)).toBe('');
  });
});

describe('meridiemOf / toHour12 / toHour24', () => {
  it('splits the day at noon', () => {
    expect(meridiemOf(0)).toBe('AM');
    expect(meridiemOf(11)).toBe('AM');
    expect(meridiemOf(12)).toBe('PM');
    expect(meridiemOf(23)).toBe('PM');
  });

  it('maps 0 and 12 onto the 12 face', () => {
    expect(toHour12(0)).toBe(12);
    expect(toHour12(12)).toBe(12);
    expect(toHour12(13)).toBe(1);
    expect(toHour12(23)).toBe(11);
  });

  it('maps a face and a meridiem back to 24 hours', () => {
    expect(toHour24(12, 'AM')).toBe(0);
    expect(toHour24(12, 'PM')).toBe(12);
    expect(toHour24(1, 'AM')).toBe(1);
    expect(toHour24(1, 'PM')).toBe(13);
    expect(toHour24(11, 'PM')).toBe(23);
  });

  /* Every hour of the day survives a trip through the 12-hour face. */
  it('round-trips all 24 hours', () => {
    for (let hour = 0; hour < 24; hour += 1) {
      expect(toHour24(toHour12(hour), meridiemOf(hour))).toBe(hour);
    }
  });
});

describe('timeRange / hourOptions', () => {
  it('counts every minute by default', () => {
    expect(timeRange(60)).toHaveLength(60);
    expect(timeRange(60)[59]).toBe(59);
  });

  it('steps by the given amount', () => {
    expect(timeRange(60, 15)).toEqual([0, 15, 30, 45]);
    expect(timeRange(60, 30)).toEqual([0, 30]);
  });

  /* A step that does not divide the hour stops short rather than overshooting. */
  it('never offers a value outside the range', () => {
    for (const step of [1, 5, 7, 15, 25, 45, 59]) {
      for (const value of timeRange(60, step)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(60);
      }
    }
    expect(timeRange(60, 25)).toEqual([0, 25, 50]);
  });

  it('treats a nonsense step as 1 rather than dividing by zero', () => {
    expect(timeRange(5, 0)).toEqual([0, 1, 2, 3, 4]);
    expect(timeRange(5, -3)).toEqual([0, 1, 2, 3, 4]);
    expect(timeRange(5, 2.7)).toEqual([0, 2, 4]);
  });

  it('offers 0–23 on a 24-hour cycle and the 1–12 face on a 12-hour one', () => {
    expect(hourOptions(24)).toHaveLength(24);
    expect(hourOptions(24)[0]).toBe(0);
    expect(hourOptions(24)[23]).toBe(23);

    expect(hourOptions(12)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});

describe('padTimePart', () => {
  it('pads a single digit and leaves two alone', () => {
    expect(padTimePart(0)).toBe('00');
    expect(padTimePart(9)).toBe('09');
    expect(padTimePart(23)).toBe('23');
  });
});
