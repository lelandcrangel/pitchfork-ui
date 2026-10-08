import { describe, expect, it } from 'vitest';
import { resolveCurrentNavItem } from './nav';

describe('resolveCurrentNavItem', () => {
  it('finds the item that says it is current', () => {
    expect(resolveCurrentNavItem([{}, { current: true }, {}])).toBe(1);
  });

  it('takes the first of several, so a navigation cannot mark two pages', () => {
    expect(resolveCurrentNavItem([{ current: true }, { current: true }])).toBe(0);
  });

  /*
   * The difference from a breadcrumb trail, which falls back to its last
   * crumb: every item in a navigation points somewhere the reader is not.
   */
  it('marks nothing when no item says it is current', () => {
    expect(resolveCurrentNavItem([{}, {}, {}])).toBe(-1);
  });

  it('is -1 for an empty navigation', () => {
    expect(resolveCurrentNavItem([])).toBe(-1);
  });

  it('treats a falsy flag as not current', () => {
    expect(resolveCurrentNavItem([{ current: false }, { current: undefined }])).toBe(-1);
  });
});
