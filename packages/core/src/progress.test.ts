import { describe, expect, it } from 'vitest';

import {
  clampProgressPercent,
  clampToRange,
  getProgressCircleGeometry,
  getRangePercent,
  normalizeRange,
  progressValueNow,
} from './progress';

describe('clampProgressPercent', () => {
  it('converts a value to a percentage of max', () => {
    expect(clampProgressPercent(30, 60)).toBe(50);
    expect(clampProgressPercent(25, 100)).toBe(25);
  });

  it('clamps below zero and above max', () => {
    expect(clampProgressPercent(-10, 100)).toBe(0);
    expect(clampProgressPercent(150, 100)).toBe(100);
  });

  /*
   * Dividing by a non-positive max gives Infinity or NaN, neither of which is a
   * drawable width or an announceable value.
   */
  it('returns zero rather than Infinity for a max of zero or less', () => {
    expect(clampProgressPercent(10, 0)).toBe(0);
    expect(clampProgressPercent(10, -5)).toBe(0);
  });

  it('returns zero for a NaN max or value', () => {
    expect(clampProgressPercent(10, Number.NaN)).toBe(0);
    expect(clampProgressPercent(Number.NaN, 100)).toBe(0);
  });

  /*
   * An infinite value is an overshoot and an undershoot, not an absence of
   * one: it belongs at the end of the range it ran off, which is what the
   * clamp gives if NaN is the only thing guarded.
   */
  it('clamps an infinite value to the end of the range it overran', () => {
    expect(clampProgressPercent(Number.POSITIVE_INFINITY, 100)).toBe(100);
    expect(clampProgressPercent(Number.NEGATIVE_INFINITY, 100)).toBe(0);
  });
});

describe('progressValueNow', () => {
  it('maps a percentage back onto the max scale', () => {
    expect(progressValueNow(50, 60)).toBe(30);
    expect(progressValueNow(100, 250)).toBe(250);
  });

  it('rounds, so a screen reader does not read a float artefact', () => {
    // 30/60 -> 50.00000000000001 in some orders of operations.
    expect(progressValueNow(clampProgressPercent(1, 3), 3)).toBe(1);
    expect(Number.isInteger(progressValueNow(33.333, 3))).toBe(true);
  });
});

describe('getProgressCircleGeometry', () => {
  it('insets the radius by half the stroke, so the stroke is not clipped', () => {
    const { radius, center } = getProgressCircleGeometry(64, 6, 0);

    expect(radius).toBe(29);
    expect(center).toBe(32);
    // The stroke straddles the path: outer edge must stay within the box.
    expect(center + radius + 3).toBe(64);
  });

  it('derives the circumference from that same radius', () => {
    const { radius, circumference } = getProgressCircleGeometry(64, 6, 0);

    expect(circumference).toBeCloseTo(2 * Math.PI * radius, 10);
  });

  it('leaves the whole arc undrawn at 0% and fully drawn at 100%', () => {
    const empty = getProgressCircleGeometry(64, 6, 0);
    const full = getProgressCircleGeometry(64, 6, 100);

    expect(empty.dashOffset).toBeCloseTo(empty.circumference, 10);
    expect(full.dashOffset).toBeCloseTo(0, 10);
  });

  it('leaves half the arc drawn at 50%', () => {
    const { circumference, dashOffset } = getProgressCircleGeometry(64, 6, 50);

    expect(dashOffset).toBeCloseTo(circumference / 2, 10);
  });

  it('never produces a negative radius when the stroke is wider than the box', () => {
    const { radius, circumference } = getProgressCircleGeometry(4, 10, 50);

    expect(radius).toBe(0);
    expect(circumference).toBe(0);
  });
});

describe('normalizeRange', () => {
  it('passes a sane range through untouched', () => {
    expect(normalizeRange(0, 100, 1)).toEqual({ min: 0, max: 100, step: 1 });
    expect(normalizeRange(-5, 5, 0.5)).toEqual({ min: -5, max: 5, step: 0.5 });
  });

  /* A NaN bound would give a track of NaN width — nothing to draw. */
  it('substitutes a default for a non-finite bound', () => {
    expect(normalizeRange(Number.NaN, 50, 1)).toEqual({ min: 0, max: 50, step: 1 });
    expect(normalizeRange(10, Number.NaN, 1)).toEqual({ min: 10, max: 110, step: 1 });
    expect(normalizeRange(10, Number.POSITIVE_INFINITY, 1).max).toBe(110);
  });

  /* Reading backwards is not a thing a track can draw, so it collapses. */
  it('collapses an inverted range to a single point', () => {
    expect(normalizeRange(100, 0, 1)).toEqual({ min: 100, max: 100, step: 1 });
  });

  /* A step of zero makes the control reject every value the user picks. */
  it('falls back to a step of 1 for a non-positive or non-finite step', () => {
    expect(normalizeRange(0, 10, 0).step).toBe(1);
    expect(normalizeRange(0, 10, -2).step).toBe(1);
    expect(normalizeRange(0, 10, Number.NaN).step).toBe(1);
  });
});

describe('getRangePercent', () => {
  /*
   * The distinction from clampProgressPercent: a slider's track starts at min,
   * so the same value sits differently on two ranges of the same width.
   */
  it('measures from min, not from zero', () => {
    expect(getRangePercent(5, 0, 10)).toBe(50);
    expect(getRangePercent(5, 5, 15)).toBe(0);
    expect(getRangePercent(10, 5, 15)).toBe(50);
  });

  it('handles a range that does not start at zero', () => {
    expect(getRangePercent(-5, -10, 0)).toBe(50);
  });

  it('clamps outside the range', () => {
    expect(getRangePercent(-20, 0, 10)).toBe(0);
    expect(getRangePercent(99, 0, 10)).toBe(100);
  });

  it('returns zero for a collapsed range rather than dividing by zero', () => {
    expect(getRangePercent(5, 5, 5)).toBe(0);
    expect(getRangePercent(5, 10, 0)).toBe(0);
  });

  it('returns zero for a NaN value', () => {
    expect(getRangePercent(Number.NaN, 0, 10)).toBe(0);
  });
});

describe('clampToRange', () => {
  it('keeps a value inside the bounds', () => {
    expect(clampToRange(5, 0, 10)).toBe(5);
    expect(clampToRange(-1, 0, 10)).toBe(0);
    expect(clampToRange(11, 0, 10)).toBe(10);
  });

  /* NaN has no place on the range, so it starts at the bottom of it. */
  it('maps NaN onto min', () => {
    expect(clampToRange(Number.NaN, 3, 10)).toBe(3);
  });
});
