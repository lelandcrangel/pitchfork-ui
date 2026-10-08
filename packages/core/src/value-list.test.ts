import { describe, expect, it } from 'vitest';
import {
  addTag,
  assertSeparableValues,
  formatValueList,
  parseValueList,
  removeTagAt,
  splitPastedTags,
  toggleDisclosureValue,
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

describe('addTag', () => {
  it('adds a trimmed tag', () => {
    expect(addTag([], '  react  ')).toEqual({ tags: ['react'], added: true, refusal: null });
  });

  it('appends to the end', () => {
    expect(addTag(['a'], 'b').tags).toEqual(['a', 'b']);
  });

  it('refuses an empty or whitespace tag', () => {
    expect(addTag([], '').refusal).toBe('empty');
    expect(addTag([], '   ').refusal).toBe('empty');
  });

  /* Case-insensitive, so `React` and `react` are one tag. */
  it('refuses a duplicate regardless of case', () => {
    expect(addTag(['React'], 'react').refusal).toBe('duplicate');
    expect(addTag(['react'], 'REACT').refusal).toBe('duplicate');
  });

  it('allows a duplicate when asked', () => {
    const result = addTag(['react'], 'React', { allowDuplicates: true });
    expect(result.added).toBe(true);
    expect(result.tags).toEqual(['react', 'React']);
  });

  it('refuses once the maximum is reached', () => {
    expect(addTag(['a', 'b'], 'c', { max: 2 }).refusal).toBe('max');
    expect(addTag(['a'], 'b', { max: 2 }).added).toBe(true);
  });

  /*
   * `invalid`, not `duplicate`. An earlier version reported a validate
   * rejection as a duplicate, and this test did not notice because it only
   * checked `added`.
   */
  it('refuses what validate rejects, and says it was invalid', () => {
    const result = addTag([], 'nope', { validate: (tag) => tag !== 'nope' });
    expect(result.added).toBe(false);
    expect(result.refusal).toBe('invalid');
  });

  it('names each refusal distinctly', () => {
    expect(addTag([], '').refusal).toBe('empty');
    expect(addTag(['a'], 'b', { max: 1 }).refusal).toBe('max');
    expect(addTag(['a'], 'a').refusal).toBe('duplicate');
    expect(addTag([], 'x', { validate: () => false }).refusal).toBe('invalid');
  });

  it('passes the trimmed tag to validate', () => {
    const seen: string[] = [];
    addTag([], '  spaced  ', {
      validate: (tag) => {
        seen.push(tag);
        return true;
      },
    });
    expect(seen).toEqual(['spaced']);
  });

  it('does not mutate the list it is given', () => {
    const original = ['a'];
    addTag(original, 'b');
    expect(original).toEqual(['a']);
  });

  /* A refusal still returns a list, so a caller can assign unconditionally. */
  it('returns a copy even when it refuses', () => {
    const original = ['a'];
    const result = addTag(original, 'a');
    expect(result.tags).toEqual(['a']);
    expect(result.tags).not.toBe(original);
  });
});

describe('removeTagAt', () => {
  it('removes that one and keeps the order', () => {
    expect(removeTagAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
  });

  it('is a no-op for an index that is not there', () => {
    expect(removeTagAt(['a'], 5)).toEqual(['a']);
    expect(removeTagAt(['a'], -1)).toEqual(['a']);
  });
});

describe('splitPastedTags', () => {
  it('splits on commas, newlines and tabs', () => {
    expect(splitPastedTags('a,b')).toEqual(['a', 'b']);
    expect(splitPastedTags('a\nb')).toEqual(['a', 'b']);
    expect(splitPastedTags('a\tb')).toEqual(['a', 'b']);
  });

  it('trims each part and drops the empties', () => {
    expect(splitPastedTags(' a , , b ')).toEqual(['a', 'b']);
  });

  /* Empty when there is nothing to split on, so the caller leaves the paste alone. */
  it('is empty for text with no separator', () => {
    expect(splitPastedTags('one tag')).toEqual([]);
    expect(splitPastedTags('')).toEqual([]);
  });

  it('collapses runs of separators', () => {
    expect(splitPastedTags('a,,\n\tb')).toEqual(['a', 'b']);
  });
});

describe('toggleDisclosureValue', () => {
  it('opens one section at a time in single mode', () => {
    expect(toggleDisclosureValue([], 'a')).toEqual(['a']);
    expect(toggleDisclosureValue(['a'], 'b')).toEqual(['b']);
  });

  it('closes the open section, leaving nothing open', () => {
    expect(toggleDisclosureValue(['a'], 'a')).toEqual([]);
  });

  /* A group handed several expanded values collapses to the one picked. */
  it('collapses a pre-expanded set in single mode', () => {
    expect(toggleDisclosureValue(['a', 'b', 'c'], 'b')).toEqual([]);
    expect(toggleDisclosureValue(['a', 'b', 'c'], 'd')).toEqual(['d']);
  });

  it('keeps the others open in multiple mode', () => {
    expect(toggleDisclosureValue(['a'], 'b', { multiple: true })).toEqual(['a', 'b']);
    expect(toggleDisclosureValue(['a', 'b'], 'a', { multiple: true })).toEqual(['b']);
  });

  it('leaves the input alone', () => {
    const expanded = ['a'];
    toggleDisclosureValue(expanded, 'b', { multiple: true });
    expect(expanded).toEqual(['a']);
  });
});
