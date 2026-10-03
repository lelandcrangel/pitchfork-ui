import { describe, expect, it } from 'vitest';
import {
  findTypeaheadMatch,
  isTypeaheadKey,
  nextTypeaheadBuffer,
  TYPEAHEAD_TIMEOUT_MS,
} from './typeahead';

const FRUIT = ['Apple', 'Apricot', 'Banana', 'Blackberry', 'Cherry'];

describe('isTypeaheadKey', () => {
  it('accepts single printable characters', () => {
    for (const key of ['a', 'Z', '7', '-', 'é']) {
      expect(isTypeaheadKey(key), key).toBe(true);
    }
  });

  /* Excluded by length, so a new named key needs no change here. */
  it('rejects named keys', () => {
    for (const key of ['Enter', 'ArrowDown', 'Escape', 'Tab', 'Home', 'Backspace']) {
      expect(isTypeaheadKey(key), key).toBe(false);
    }
  });

  /* A space selects in a listbox, so it is deliberately not typeahead. */
  it('rejects a space', () => {
    expect(isTypeaheadKey(' ')).toBe(false);
  });
});

describe('nextTypeaheadBuffer', () => {
  it('appends, lower-cased', () => {
    expect(nextTypeaheadBuffer('', 'B')).toBe('b');
    expect(nextTypeaheadBuffer('b', 'R')).toBe('br');
  });

  it('ignores a key that is not typeahead', () => {
    expect(nextTypeaheadBuffer('br', 'Enter')).toBe('br');
    expect(nextTypeaheadBuffer('br', ' ')).toBe('br');
  });

  it('keeps a repeat, which is what signals cycling', () => {
    expect(nextTypeaheadBuffer('b', 'b')).toBe('bb');
  });
});

describe('findTypeaheadMatch', () => {
  it('finds the first match from the start', () => {
    expect(findTypeaheadMatch(FRUIT, 'b')).toBe(2);
  });

  it('narrows on a longer buffer', () => {
    expect(findTypeaheadMatch(FRUIT, 'bl')).toBe(3);
    expect(findTypeaheadMatch(FRUIT, 'ap')).toBe(0);
    expect(findTypeaheadMatch(FRUIT, 'apr')).toBe(1);
  });

  it('ignores case on both sides', () => {
    expect(findTypeaheadMatch(FRUIT, 'c')).toBe(4);
    expect(findTypeaheadMatch(['ÉCLAIR'], 'é')).toBe(0);
  });

  it('is -1 when nothing matches, and for an empty buffer or list', () => {
    expect(findTypeaheadMatch(FRUIT, 'z')).toBe(-1);
    expect(findTypeaheadMatch(FRUIT, '')).toBe(-1);
    expect(findTypeaheadMatch([], 'a')).toBe(-1);
  });

  /*
   * Narrowing keeps you where you are: having typed `b` and landed on Banana,
   * typing `a` makes `ba`, which should stay on Banana rather than skip on.
   */
  it('includes the current option when narrowing', () => {
    expect(findTypeaheadMatch(FRUIT, 'ba', 2)).toBe(2);
  });

  /* Cycling means "the next one", so it starts past the current option. */
  it('steps to the next match when the buffer is one repeated character', () => {
    expect(findTypeaheadMatch(FRUIT, 'bb', 2)).toBe(3);
    expect(findTypeaheadMatch(FRUIT, 'bbb', 3)).toBe(2);
  });

  /*
   * A *single* letter cycles too, which is the case that matters most and the
   * one an earlier version got wrong: pressing `b` while already on Banana
   * moves to Blackberry, as a native `<select>` does, rather than staying put
   * because Banana also starts with `b`.
   */
  it('steps past the current option on a single letter', () => {
    expect(findTypeaheadMatch(FRUIT, 'b', 2)).toBe(3);
    expect(findTypeaheadMatch(FRUIT, 'a', 0)).toBe(1);
  });

  /* Still inclusive of index 0 when there is no current option. */
  it('includes the first option when nothing is active', () => {
    expect(findTypeaheadMatch(FRUIT, 'a')).toBe(0);
    expect(findTypeaheadMatch(FRUIT, 'a', -1)).toBe(0);
  });

  it('cycles around a two-option run forever', () => {
    let index = findTypeaheadMatch(FRUIT, 'b');
    const visited: number[] = [index];
    for (let press = 0; press < 4; press += 1) {
      index = findTypeaheadMatch(FRUIT, 'b'.repeat(press + 2), index);
      visited.push(index);
    }
    expect(visited).toEqual([2, 3, 2, 3, 2]);
  });

  /* And a single-option match stays on it rather than reporting -1. */
  it('stays put when it is the only match', () => {
    expect(findTypeaheadMatch(FRUIT, 'c', 4)).toBe(4);
  });

  /* Wraps, so a match behind the current option is still found. */
  it('wraps past the end of the list', () => {
    expect(findTypeaheadMatch(FRUIT, 'a', 4)).toBe(0);
    expect(findTypeaheadMatch(FRUIT, 'aa', 4)).toBe(0);
  });

  it('skips a disabled option rather than landing on it', () => {
    const disabled = (index: number) => index === 2;
    expect(findTypeaheadMatch(FRUIT, 'b', -1, disabled)).toBe(3);
  });

  it('is -1 when every match is disabled', () => {
    const disabled = (index: number) => index === 2 || index === 3;
    expect(findTypeaheadMatch(FRUIT, 'b', -1, disabled)).toBe(-1);
  });

  it('matches a label with surrounding whitespace', () => {
    expect(findTypeaheadMatch(['  Banana  '], 'ban')).toBe(0);
  });

  it('handles a single-option list, cycling included', () => {
    expect(findTypeaheadMatch(['Only'], 'o')).toBe(0);
    expect(findTypeaheadMatch(['Only'], 'oo', 0)).toBe(0);
  });

  it('offers a timeout for the caller to end a word on', () => {
    expect(TYPEAHEAD_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
