import { describe, expect, it } from 'vitest';
import { sparklineAreaPath, sparklineLinePath, sparklinePoints } from './sparkline';

const box = { width: 100, height: 40, padding: 4 };

describe('sparklinePoints', () => {
  it('spreads the values across the inner width', () => {
    const points = sparklinePoints([0, 5, 10], box);
    expect(points.map(([x]) => x)).toEqual([4, 50, 96]);
  });

  it('puts the largest at the top and the smallest at the bottom', () => {
    const [low, , high] = sparklinePoints([0, 5, 10], box);
    expect(low[1]).toBe(36);
    expect(high[1]).toBe(4);
  });

  /*
   * One value divided by `length - 1`, which is zero: the React version's x
   * came out NaN and an end dot rendered `cx="NaN"`.
   */
  it('puts a single value in the middle of the box', () => {
    expect(sparklinePoints([7], box)).toEqual([[50, 20]]);
    expect(
      sparklinePoints([7], box).every(([x, y]) => Number.isFinite(x) && Number.isFinite(y)),
    ).toBe(true);
  });

  /* A flat series has no shape, so an edge reads as a collapse. */
  it('centres a series whose values are all equal', () => {
    expect(sparklinePoints([5, 5, 5], box).map(([, y]) => y)).toEqual([20, 20, 20]);
  });

  it('is empty for no values', () => {
    expect(sparklinePoints([], box)).toEqual([]);
  });

  it('handles negatives', () => {
    const points = sparklinePoints([-10, 0, 10], box);
    expect(points[0][1]).toBe(36);
    expect(points[2][1]).toBe(4);
    expect(points[1][1]).toBe(20);
  });
});

describe('sparklineLinePath', () => {
  it('draws a move and a line per point after the first', () => {
    expect(
      sparklineLinePath([
        [0, 1],
        [2, 3],
        [4, 5],
      ]),
    ).toBe('M 0 1 L 2 3 L 4 5');
  });

  it('draws nothing from fewer than two points', () => {
    expect(sparklineLinePath([])).toBe('');
    expect(sparklineLinePath([[0, 1]])).toBe('');
  });
});

describe('sparklineAreaPath', () => {
  it('closes the line down to the bottom and back', () => {
    expect(
      sparklineAreaPath(
        [
          [0, 1],
          [4, 5],
        ],
        40,
      ),
    ).toBe('M 0 1 L 4 5 L 4 40 L 0 40 Z');
  });

  /*
   * No boolean anywhere in it. The React version's `buildPath(points, close)`
   * wrote `L ${lastX} ${close}`, which would have produced `L 4 true` — never
   * reached, because every call site passed one argument.
   */
  it('never puts a non-number in the path', () => {
    const path = sparklineAreaPath(
      [
        [0, 1],
        [4, 5],
      ],
      40,
    );
    expect(path).not.toMatch(/true|false|NaN|undefined/);
  });

  it('draws nothing from fewer than two points', () => {
    expect(sparklineAreaPath([], 40)).toBe('');
    expect(sparklineAreaPath([[0, 1]], 40)).toBe('');
  });
});
