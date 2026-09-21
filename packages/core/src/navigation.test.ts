import { describe, expect, it } from 'vitest';
import { getEnabledIndexes, getNextEnabledIndex, resolveListMove } from './navigation';

const items = ['a', 'b', 'c', 'd'];

describe('getEnabledIndexes', () => {
  it('returns every index when nothing is disabled', () => {
    expect(getEnabledIndexes(items)).toEqual([0, 1, 2, 3]);
  });

  it('skips disabled items and keeps source order', () => {
    expect(getEnabledIndexes(items, (_item, index) => index % 2 === 0)).toEqual([1, 3]);
  });

  it('passes both the item and its index to the predicate', () => {
    expect(getEnabledIndexes(items, (item) => item === 'c')).toEqual([0, 1, 3]);
  });

  it('returns an empty list when everything is disabled', () => {
    expect(getEnabledIndexes(items, () => true)).toEqual([]);
  });
});

describe('getNextEnabledIndex', () => {
  const enabled = [1, 3];

  it('steps forward to the next enabled index', () => {
    expect(getNextEnabledIndex(enabled, 1, 1)).toBe(3);
  });

  it('steps backward to the previous enabled index', () => {
    expect(getNextEnabledIndex(enabled, 3, -1)).toBe(1);
  });

  it('wraps forward past the end', () => {
    expect(getNextEnabledIndex(enabled, 3, 1)).toBe(1);
  });

  it('wraps backward past the start', () => {
    expect(getNextEnabledIndex(enabled, 1, -1)).toBe(3);
  });

  it('enters at the first item when moving forward from nothing active', () => {
    expect(getNextEnabledIndex(enabled, -1, 1)).toBe(1);
  });

  it('enters at the last item when moving backward from nothing active', () => {
    expect(getNextEnabledIndex(enabled, -1, -1)).toBe(3);
  });

  it('enters from a disabled start index the same way', () => {
    expect(getNextEnabledIndex(enabled, 2, 1)).toBe(1);
    expect(getNextEnabledIndex(enabled, 2, -1)).toBe(3);
  });

  it('returns -1 when nothing is selectable', () => {
    expect(getNextEnabledIndex([], 0, 1)).toBe(-1);
  });

  it('stays put when only one item is selectable', () => {
    expect(getNextEnabledIndex([2], 2, 1)).toBe(2);
    expect(getNextEnabledIndex([2], 2, -1)).toBe(2);
  });
});

describe('resolveListMove', () => {
  const enabled = [1, 3];

  it('resolves first and last', () => {
    expect(resolveListMove('first', enabled, 3)).toBe(1);
    expect(resolveListMove('last', enabled, 1)).toBe(3);
  });

  it('resolves next and previous from the current index', () => {
    expect(resolveListMove('next', enabled, 1)).toBe(3);
    expect(resolveListMove('previous', enabled, 3)).toBe(1);
  });

  it('returns -1 for every action when nothing is selectable', () => {
    for (const action of ['first', 'last', 'next', 'previous'] as const) {
      expect(resolveListMove(action, [], 0)).toBe(-1);
    }
  });
});
