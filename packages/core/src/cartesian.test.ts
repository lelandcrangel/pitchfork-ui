import { describe, expect, it } from 'vitest';
import {
  CHART_PADDING,
  CHART_PLOT,
  areaSeriesPath,
  axisLabelStep,
  barGeometry,
  chartSeriesColor,
  formatAxisTick,
  niceAxisTicks,
  plotX,
  plotY,
  smoothSeriesPath,
  straightSeriesPath,
} from './cartesian';
import { CHART_SERIES_COLORS } from './pie';

describe('chartSeriesColor', () => {
  it('walks the palette and wraps', () => {
    expect(chartSeriesColor(0)).toBe(CHART_SERIES_COLORS[0]);
    expect(chartSeriesColor(6)).toBe(CHART_SERIES_COLORS[0]);
  });

  it('prefers a colour the series asked for', () => {
    expect(chartSeriesColor(0, 'red')).toBe('red');
  });
});

describe('niceAxisTicks', () => {
  it('starts at zero and ends at or above the maximum', () => {
    const ticks = niceAxisTicks(94);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(94);
  });

  it('steps in a round number', () => {
    expect(niceAxisTicks(100)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceAxisTicks(10)).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it('adds no empty tick above a maximum that lands on one', () => {
    expect(niceAxisTicks(100).filter((tick) => tick > 100)).toEqual([]);
  });

  /* `v += step` drifts: a step of 0.1 gave 0.30000000000000004 as a label. */
  it('does not drift on a fractional step', () => {
    const ticks = niceAxisTicks(0.5);
    expect(ticks).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5]);
    expect(ticks.every((tick) => String(tick).length < 6)).toBe(true);
  });

  /*
   * A maximum that is not a number used to fall through the `<= 0` guard,
   * make the step NaN, and produce an **empty** array — after which the
   * chart's `maxTick` was `undefined` and every coordinate came out NaN.
   */
  it('falls back to a usable scale for a maximum that is not one', () => {
    expect(niceAxisTicks(Number.NaN)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(niceAxisTicks(Number.POSITIVE_INFINITY)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(niceAxisTicks(0)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(niceAxisTicks(-10)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('never returns fewer than two ticks', () => {
    for (const max of [0.0001, 1, 3, 1e9]) {
      expect(niceAxisTicks(max).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('takes a tick count', () => {
    expect(niceAxisTicks(100, 2).length).toBeLessThan(niceAxisTicks(100, 10).length);
  });
});

describe('formatAxisTick', () => {
  it('rounds a plain number', () => {
    expect(formatAxisTick(940.4)).toBe('940');
    expect(formatAxisTick(0)).toBe('0');
  });

  it('abbreviates thousands and millions', () => {
    expect(formatAxisTick(2000)).toBe('2k');
    expect(formatAxisTick(1500)).toBe('1.5k');
    expect(formatAxisTick(2_500_000)).toBe('2.5M');
  });

  /*
   * The React version ended in `String(Math.round(value))`, so every tick on
   * an axis topping out below 1 printed as `0` — six gridlines all labelled
   * zero on a chart of rates.
   */
  it('keeps a fraction readable', () => {
    expect(formatAxisTick(0.1)).toBe('0.1');
    expect(formatAxisTick(0.25)).toBe('0.25');
    expect(formatAxisTick(0.005)).toBe('0.005');
    expect(formatAxisTick(0.30000000000000004)).toBe('0.3');
  });

  it('is harmless for a value that is not a number', () => {
    expect(formatAxisTick(Number.NaN)).toBe('0');
  });
});

describe('plotY', () => {
  it('puts zero on the floor and the maximum on the ceiling', () => {
    expect(plotY(0, 100)).toBe(CHART_PADDING.top + CHART_PLOT.height);
    expect(plotY(100, 100)).toBe(CHART_PADDING.top);
  });

  it('puts half way in the middle', () => {
    expect(plotY(50, 100)).toBe(CHART_PADDING.top + CHART_PLOT.height / 2);
  });

  it('survives a maximum of zero and a value that is not a number', () => {
    expect(Number.isFinite(plotY(5, 0))).toBe(true);
    expect(plotY(Number.NaN, 100)).toBe(CHART_PADDING.top + CHART_PLOT.height);
  });
});

describe('plotX', () => {
  it('spreads the points across the plot', () => {
    expect(plotX(0, 3)).toBe(CHART_PADDING.left);
    expect(plotX(2, 3)).toBe(CHART_PADDING.left + CHART_PLOT.width);
  });

  /* `index / (count - 1)` divides by zero for one point. */
  it('centres a single point', () => {
    expect(plotX(0, 1)).toBe(CHART_PADDING.left + CHART_PLOT.width / 2);
    expect(Number.isFinite(plotX(0, 0))).toBe(true);
  });
});

describe('straightSeriesPath', () => {
  it('moves to the first point and lines to the rest', () => {
    expect(
      straightSeriesPath([
        { x: 0, y: 1 },
        { x: 2, y: 3 },
      ]),
    ).toBe('M 0,1 L 2,3');
  });

  it('is empty for no points', () => {
    expect(straightSeriesPath([])).toBe('');
  });
});

describe('smoothSeriesPath', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 0 },
    { x: 30, y: 10 },
  ];

  it('is a straight line below three points', () => {
    expect(smoothSeriesPath([{ x: 0, y: 1 }])).toBe('M 0,1');
    expect(
      smoothSeriesPath([
        { x: 0, y: 1 },
        { x: 2, y: 3 },
      ]),
    ).toBe('M 0,1 L 2,3');
  });

  /* A line that misses its own dots is a chart nobody trusts. */
  it('passes through every point', () => {
    const path = smoothSeriesPath(points);
    for (const point of points) {
      expect(path).toContain(`${point.x},${point.y}`);
    }
  });

  it('draws one curve per span', () => {
    expect(smoothSeriesPath(points).match(/C /g)).toHaveLength(points.length - 1);
  });

  it('never puts a non-number in the path', () => {
    expect(smoothSeriesPath(points)).not.toMatch(/NaN|undefined/);
    expect(smoothSeriesPath([])).toBe('');
  });
});

describe('areaSeriesPath', () => {
  it('closes the line down to the floor and back', () => {
    const floor = CHART_PADDING.top + CHART_PLOT.height;
    expect(
      areaSeriesPath('M 0,1 L 2,3', [
        { x: 0, y: 1 },
        { x: 2, y: 3 },
      ]),
    ).toBe(`M 0,1 L 2,3 L 2,${floor} L 0,${floor} Z`);
  });

  it('is empty with no line or no points', () => {
    expect(areaSeriesPath('', [{ x: 0, y: 0 }])).toBe('');
    expect(areaSeriesPath('M 0,0', [])).toBe('');
  });
});

describe('barGeometry', () => {
  it('splits a group between its series', () => {
    const one = barGeometry(4, 1, false);
    const two = barGeometry(4, 2, false);

    expect(two.barWidth).toBeLessThan(one.barWidth);
    expect(one.groupLefts).toHaveLength(4);
    expect(one.groupCenters[0]).toBeGreaterThan(one.groupLefts[0]);
  });

  it('gives a stacked group its whole width', () => {
    expect(barGeometry(4, 3, true).barWidth).toBeGreaterThan(barGeometry(4, 3, false).barWidth);
  });

  /*
   * `(total - gap * (m - 1)) / m` goes negative with enough series, and a
   * negative `width` on a `<rect>` is an error the browser drops the element
   * for — a chart of twelve series silently lost its bars.
   */
  it('never gives a bar a negative width', () => {
    for (const series of [8, 12, 40]) {
      const geometry = barGeometry(6, series, false);
      expect(geometry.barWidth).toBeGreaterThan(0);
    }
  });

  it('survives counts that are not numbers', () => {
    const geometry = barGeometry(Number.NaN, Number.NaN, false);
    expect(Number.isFinite(geometry.groupWidth)).toBe(true);
    expect(geometry.groupLefts).toHaveLength(1);
  });
});

describe('axisLabelStep', () => {
  it('prints every label when they fit', () => {
    expect(axisLabelStep(7)).toBe(1);
    expect(axisLabelStep(12)).toBe(1);
  });

  it('thins them out when they do not', () => {
    expect(axisLabelStep(24)).toBe(2);
    expect(axisLabelStep(40)).toBe(4);
  });

  it('is at least one', () => {
    expect(axisLabelStep(0)).toBe(1);
    expect(axisLabelStep(-5)).toBe(1);
  });
});
