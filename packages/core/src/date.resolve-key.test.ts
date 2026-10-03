import { describe, expect, it } from 'vitest';
import { moveCalendarDate, resolveCalendarKey } from './date';

describe('resolveCalendarKey', () => {
  it('maps the eight grid keys', () => {
    expect(resolveCalendarKey('ArrowRight')).toBe('day-next');
    expect(resolveCalendarKey('ArrowLeft')).toBe('day-previous');
    expect(resolveCalendarKey('ArrowDown')).toBe('week-next');
    expect(resolveCalendarKey('ArrowUp')).toBe('week-previous');
    expect(resolveCalendarKey('Home')).toBe('week-start');
    expect(resolveCalendarKey('End')).toBe('week-end');
    expect(resolveCalendarKey('PageDown')).toBe('month-next');
    expect(resolveCalendarKey('PageUp')).toBe('month-previous');
  });

  /*
   * Null rather than a no-op move, so the caller can tell "I handled this" from
   * "pass it on" -- Tab has to keep leaving the grid and Enter has to select.
   */
  it('returns null for a key it does not handle', () => {
    for (const key of ['Tab', 'Enter', ' ', 'Escape', 'a', 'F5']) {
      expect(resolveCalendarKey(key), key).toBeNull();
    }
  });

  /*
   * The year moves have no key of their own: the year picker calls
   * `moveCalendarDate` directly. Worth pinning, so adding a key for them is a
   * deliberate change rather than a surprise.
   */
  it('has no key for the year moves', () => {
    const keys = [
      'ArrowRight',
      'ArrowLeft',
      'ArrowDown',
      'ArrowUp',
      'Home',
      'End',
      'PageDown',
      'PageUp',
    ];
    const moves = keys.map(resolveCalendarKey);
    expect(moves).not.toContain('year-next');
    expect(moves).not.toContain('year-previous');
    // Still reachable, just not from a key.
    expect(moveCalendarDate(new Date(2024, 0, 15, 12), 'year-next').getFullYear()).toBe(2025);
  });
});
