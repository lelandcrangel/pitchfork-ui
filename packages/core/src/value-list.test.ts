import { describe, expect, it } from 'vitest';
import {
  assertSeparableValues,
  formatValueList,
  parseValueList,
  toggleValueInList,
} from './value-list';

describe('parseValueList', () => {
  it('splits on commas', () => {
    expect(parseValueList('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('is empty for nothing', () => {
    expect(parseValueList('')).toEqual([]);
    expect(parseValueList(null)).toEqual([]);
    expect(parseValueList(undefined)).toEqual([]);
  });

  it('trims each part and drops the empties', () => {
    expect(parseValueList(' a , b ')).toEqual(['a', 'b']);
    expect(parseValueList('a,,b')).toEqual(['a', 'b']);
    expect(parseValueList(',')).toEqual([]);
  });

  it('keeps duplicates, which are the caller’s to decide about', () => {
    expect(parseValueList('a,a')).toEqual(['a', 'a']);
  });
});

describe('formatValueList', () => {
  it('joins with no spaces, so it parses back the same', () => {
    expect(formatValueList(['a', 'b'])).toBe('a,b');
    expect(parseValueList(formatValueList(['a', 'b']))).toEqual(['a', 'b']);
  });

  it('is empty for an empty list', () => {
    expect(formatValueList([])).toBe('');
  });

  it('round-trips a list with awkward spacing', () => {
    expect(parseValueList(formatValueList(['a', 'b', 'c']))).toEqual(['a', 'b', 'c']);
  });
});

describe('toggleValueInList', () => {
  it('appends what is not there', () => {
    expect(toggleValueInList([], 'a')).toEqual(['a']);
    expect(toggleValueInList(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes what is', () => {
    expect(toggleValueInList(['a', 'b'], 'a')).toEqual(['b']);
  });

  /* Appended at the end, so the list reads in the order they were picked. */
  it('appends in pick order rather than the options’ order', () => {
    expect(toggleValueInList(['c'], 'a')).toEqual(['c', 'a']);
  });

  it('leaves the rest where they were when one is removed', () => {
    expect(toggleValueInList(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('does not mutate what it is given', () => {
    const original = ['a'];
    toggleValueInList(original, 'b');
    expect(original).toEqual(['a']);
  });

  it('round-trips: toggling twice is a no-op', () => {
    expect(toggleValueInList(toggleValueInList(['a', 'b'], 'c'), 'c')).toEqual(['a', 'b']);
  });
});

describe('assertSeparableValues', () => {
  it('finds nothing wrong with ordinary values', () => {
    expect(assertSeparableValues(['a', 'b-c', 'd_e'])).toEqual([]);
  });

  /* Named rather than thrown on, so one warning can list every offender. */
  it('names every value holding a separator', () => {
    expect(assertSeparableValues(['a', 'b,c', 'd', 'e,f'])).toEqual(['b,c', 'e,f']);
  });
});
