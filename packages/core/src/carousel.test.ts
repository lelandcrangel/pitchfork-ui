import { describe, expect, it } from 'vitest';
import { resolveSlideIndex, slidePositionLabel } from './carousel';

describe('resolveSlideIndex', () => {
  it('leaves an index inside the range alone', () => {
    expect(resolveSlideIndex(2, 5)).toBe(2);
    expect(resolveSlideIndex(2, 5, true)).toBe(2);
  });

  it('clamps at both ends when it does not loop', () => {
    expect(resolveSlideIndex(-1, 5)).toBe(0);
    expect(resolveSlideIndex(9, 5)).toBe(4);
  });

  /* `-1 % 5` is `-1` in JavaScript, which is the whole reason this exists. */
  it('wraps at both ends when it loops', () => {
    expect(resolveSlideIndex(5, 5, true)).toBe(0);
    expect(resolveSlideIndex(-1, 5, true)).toBe(4);
    expect(resolveSlideIndex(-6, 5, true)).toBe(4);
  });

  it('has no slide to land on in an empty carousel', () => {
    expect(resolveSlideIndex(0, 0)).toBe(-1);
    expect(resolveSlideIndex(0, 0, true)).toBe(-1);
  });

  it('takes the first slide for an index that is not one', () => {
    expect(resolveSlideIndex(Number.NaN, 5)).toBe(0);
    expect(resolveSlideIndex(2.7, 5)).toBe(2);
  });
});

describe('slidePositionLabel', () => {
  it('counts from one, the way a reader does', () => {
    expect(slidePositionLabel(0, 5)).toBe('Slide 1 of 5');
    expect(slidePositionLabel(4, 5)).toBe('Slide 5 of 5');
  });

  it('resolves an index outside the range before announcing it', () => {
    expect(slidePositionLabel(9, 5)).toBe('Slide 5 of 5');
    expect(slidePositionLabel(-1, 5)).toBe('Slide 1 of 5');
  });

  it('says so when there is nothing to show', () => {
    expect(slidePositionLabel(0, 0)).toBe('No slides');
  });
});
