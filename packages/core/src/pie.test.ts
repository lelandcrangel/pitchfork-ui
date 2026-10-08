import { describe, expect, it } from 'vitest';
import {
  CHART_SERIES_COLORS,
  clampPieCutout,
  pieConicGradient,
  preparePieSegments,
  roundPercentages,
} from './pie';

describe('preparePieSegments', () => {
  it('shares the total out between the slices', () => {
    const segments = preparePieSegments([{ value: 1 }, { value: 3 }]);
    expect(segments.map((segment) => segment.percentage)).toEqual([25, 75]);
  });

  it('takes a colour from the palette in order, and a given one over it', () => {
    const segments = preparePieSegments([{ value: 1 }, { value: 1, color: 'red' }]);
    expect(segments[0].color).toBe(CHART_SERIES_COLORS[0]);
    expect(segments[1].color).toBe('red');
  });

  it('wraps the palette for a seventh slice', () => {
    const segments = preparePieSegments(Array.from({ length: 7 }, () => ({ value: 1 })));
    expect(segments[6].color).toBe(CHART_SERIES_COLORS[0]);
  });

  /* A zero slice is a legend entry, not a wedge. */
  it('drops non-positive values but remembers where the rest came from', () => {
    const segments = preparePieSegments([{ value: 0 }, { value: 2 }, { value: -5 }, { value: 2 }]);
    expect(segments.map((segment) => segment.index)).toEqual([1, 3]);
    expect(segments.map((segment) => segment.percentage)).toEqual([50, 50]);
  });

  /*
   * The order is the fix: the React version totalled the *unfiltered* list,
   * so one NaN made the total NaN, slipped past its `total <= 0` guard, and
   * left every surviving slice at NaN%.
   */
  it('drops a value that is not a number', () => {
    const segments = preparePieSegments([{ value: Number.NaN }, { value: 4 }]);
    expect(segments).toHaveLength(1);
    expect(segments[0].percentage).toBe(100);
    expect(segments.every((segment) => Number.isFinite(segment.percentage))).toBe(true);
  });

  it('is empty when nothing is drawable', () => {
    expect(preparePieSegments([])).toEqual([]);
    expect(preparePieSegments([{ value: 0 }, { value: 0 }])).toEqual([]);
    expect(preparePieSegments([{ value: Number.NaN }])).toEqual([]);
  });
});

describe('roundPercentages', () => {
  it('leaves whole percentages alone', () => {
    expect(roundPercentages([25, 75])).toEqual([25, 75]);
  });

  /* Rounding each on its own gives 33/33/33, which does not add up. */
  it('sums to 100 for three equal thirds', () => {
    const thirds = [100 / 3, 100 / 3, 100 / 3];
    const rounded = roundPercentages(thirds);

    expect(rounded.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(rounded).toEqual([34, 33, 33]);
  });

  it('gives the leftover to the biggest losers first', () => {
    const rounded = roundPercentages([16.7, 16.7, 66.6]);
    expect(rounded.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(rounded).toEqual([17, 17, 66]);
  });

  it('breaks a tie by position, so the same data always rounds the same way', () => {
    expect(roundPercentages([50.5, 49.5])).toEqual([51, 49]);
  });

  it('is empty for nothing', () => {
    expect(roundPercentages([])).toEqual([]);
  });
});

describe('pieConicGradient', () => {
  it('ends each slice where the next one starts', () => {
    const gradient = pieConicGradient(preparePieSegments([{ value: 1 }, { value: 1 }]));
    expect(gradient).toBe(
      `conic-gradient(${CHART_SERIES_COLORS[0]} 0% 50%, ${CHART_SERIES_COLORS[1]} 50% 100%)`,
    );
  });

  it('never puts a non-number in a stop', () => {
    const gradient = pieConicGradient(preparePieSegments([{ value: Number.NaN }, { value: 2 }]));
    expect(gradient).not.toMatch(/NaN|undefined/);
  });
});

describe('clampPieCutout', () => {
  it('keeps a readable fraction', () => {
    expect(clampPieCutout(0.5)).toBe(0.5);
  });

  it('refuses a chart with no chart in it', () => {
    expect(clampPieCutout(1)).toBe(0.88);
    expect(clampPieCutout(5)).toBe(0.88);
  });

  it('refuses a negative hole', () => {
    expect(clampPieCutout(-1)).toBe(0);
  });

  it('is no hole at all for a fraction that is not one', () => {
    expect(clampPieCutout(Number.NaN)).toBe(0);
  });
});
