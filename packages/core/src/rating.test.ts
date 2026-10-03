import { describe, expect, it } from 'vitest';
import { clampRating, formatRating, starFillPercent } from './rating';

describe('clampRating', () => {
  it('leaves a rating inside the range alone', () => {
    expect(clampRating(3.5, 5)).toBe(3.5);
    expect(clampRating(0, 5)).toBe(0);
    expect(clampRating(5, 5)).toBe(5);
  });

  it('clamps at both ends', () => {
    expect(clampRating(-2, 5)).toBe(0);
    expect(clampRating(7, 5)).toBe(5);
  });

  it('treats a nonsense value as no rating', () => {
    expect(clampRating(Number.NaN, 5)).toBe(0);
    expect(clampRating(Number.POSITIVE_INFINITY, 5)).toBe(5);
  });

  /* A negative maximum has no range at all, so nothing can be filled. */
  it('refuses to invert a negative maximum', () => {
    expect(clampRating(3, -5)).toBe(0);
  });
});

describe('starFillPercent', () => {
  it('fills every star below the value', () => {
    expect(starFillPercent(3, 0)).toBe(100);
    expect(starFillPercent(3, 1)).toBe(100);
    expect(starFillPercent(3, 2)).toBe(100);
  });

  it('leaves every star above the value empty', () => {
    expect(starFillPercent(3, 3)).toBe(0);
    expect(starFillPercent(3, 4)).toBe(0);
  });

  /* The point of a fraction: a half star is half a star, not a whole one. */
  it('fills the star the value lands in by its fraction', () => {
    expect(starFillPercent(3.5, 3)).toBe(50);
    expect(starFillPercent(3.2, 3)).toBe(20);
    expect(starFillPercent(0.75, 0)).toBe(75);
  });

  it('rounds to a whole percentage, because it ends up in a CSS width', () => {
    expect(starFillPercent(3.333, 3)).toBe(33);
    expect(starFillPercent(3.336, 3)).toBe(34);
  });

  it('has nothing to fill for a rating of zero', () => {
    expect(starFillPercent(0, 0)).toBe(0);
  });
});

describe('formatRating', () => {
  it('always writes one decimal place', () => {
    expect(formatRating(4)).toBe('4.0');
    expect(formatRating(3.5)).toBe('3.5');
    expect(formatRating(0)).toBe('0.0');
  });

  it('rounds to that one place', () => {
    expect(formatRating(3.44)).toBe('3.4');
    expect(formatRating(3.45)).toBe('3.5');
  });

  /* A rating that is no rating reads as zero rather than as "NaN". */
  it('writes nothing nonsensical', () => {
    expect(formatRating(Number.NaN)).toBe('0.0');
    expect(formatRating(-1)).toBe('0.0');
  });
});
