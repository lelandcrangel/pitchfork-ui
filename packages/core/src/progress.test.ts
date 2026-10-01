import { describe, expect, it } from 'vitest';

import { clampProgressPercent, getProgressCircleGeometry, progressValueNow } from './progress';

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
