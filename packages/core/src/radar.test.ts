import { describe, expect, it } from 'vitest';
import {
  pointsToAttribute,
  polarPoint,
  radarAxisAngles,
  radarGridPolygons,
  radarMax,
  radarValuePoints,
  usableRadarAxes,
} from './radar';

describe('polarPoint', () => {
  it('is the centre at radius zero', () => {
    expect(polarPoint(50, 0, 0)).toEqual({ x: 50, y: 50 });
  });

  it('points right at angle zero', () => {
    const point = polarPoint(50, 10, 0);
    expect(point.x).toBeCloseTo(60, 6);
    expect(point.y).toBeCloseTo(50, 6);
  });

  /* y grows downwards in SVG, so -π/2 is up. */
  it('points up at minus a quarter turn', () => {
    const point = polarPoint(50, 10, -Math.PI / 2);
    expect(point.x).toBeCloseTo(50, 6);
    expect(point.y).toBeCloseTo(40, 6);
  });
});

describe('radarAxisAngles', () => {
  it('starts at the top', () => {
    expect(radarAxisAngles(4)[0]).toBeCloseTo(-Math.PI / 2, 6);
  });

  it('spaces the axes evenly', () => {
    const angles = radarAxisAngles(4);
    expect(angles).toHaveLength(4);
    for (let index = 1; index < angles.length; index += 1) {
      expect(angles[index] - angles[index - 1]).toBeCloseTo(Math.PI / 2, 6);
    }
  });

  it('is empty for no axes', () => {
    expect(radarAxisAngles(0)).toEqual([]);
    expect(radarAxisAngles(-3)).toEqual([]);
  });
});

describe('usableRadarAxes', () => {
  it('keeps the values it can draw', () => {
    expect(usableRadarAxes([{ value: 0 }, { value: 5 }])).toHaveLength(2);
  });

  it('drops a negative and a value that is not a number', () => {
    expect(usableRadarAxes([{ value: -1 }, { value: Number.NaN }, { value: 2 }])).toEqual([
      { value: 2 },
    ]);
  });
});

describe('radarMax', () => {
  it('takes the largest value', () => {
    expect(radarMax([{ value: 3 }, { value: 7 }])).toBe(7);
  });

  /* A consumer who set a scale means it, and the polygon clamps instead. */
  it('prefers an explicit scale even when a value exceeds it', () => {
    expect(radarMax([{ value: 50 }], 10)).toBe(10);
  });

  it('is never below one, so all zeroes still has a grid', () => {
    expect(radarMax([{ value: 0 }, { value: 0 }])).toBe(1);
    expect(radarMax([])).toBe(1);
    expect(radarMax([{ value: 5 }], 0)).toBe(5);
  });

  it('ignores a value that is not a number', () => {
    expect(radarMax([{ value: Number.NaN }, { value: 4 }])).toBe(4);
  });
});

describe('pointsToAttribute', () => {
  it('writes each point to two places', () => {
    expect(
      pointsToAttribute([
        { x: 1, y: 2 },
        { x: 3.14159, y: 4 },
      ]),
    ).toBe('1.00,2.00 3.14,4.00');
  });

  it('is empty for no points', () => {
    expect(pointsToAttribute([])).toBe('');
  });
});

describe('radarGridPolygons', () => {
  const angles = radarAxisAngles(4);

  it('draws one ring per level, the last at the outer edge', () => {
    const rings = radarGridPolygons(angles, 50, 40, 4);

    expect(rings).toHaveLength(4);
    // The outermost ring's top point is the full radius above the centre.
    expect(rings[3].split(' ')[0]).toBe('50.00,10.00');
    expect(rings[0].split(' ')[0]).toBe('50.00,40.00');
  });

  it('keeps at least two rings', () => {
    expect(radarGridPolygons(angles, 50, 40, 1)).toHaveLength(2);
    expect(radarGridPolygons(angles, 50, 40, Number.NaN)).toHaveLength(2);
  });

  it('never puts a non-number in a ring', () => {
    expect(radarGridPolygons(angles, 50, 40, Number.NaN).join(' ')).not.toMatch(/NaN/);
  });
});

describe('radarValuePoints', () => {
  const angles = radarAxisAngles(4);

  it('puts the maximum on the outer ring and zero at the centre', () => {
    const points = radarValuePoints([10, 0, 0, 0], 10, angles, 50, 40);

    expect(points[0]).toEqual({ x: expect.closeTo(50, 6), y: expect.closeTo(10, 6) });
    expect(points[1]).toEqual({ x: expect.closeTo(50, 6), y: expect.closeTo(50, 6) });
  });

  it('puts half way at half the radius', () => {
    const [top] = radarValuePoints([5], 10, radarAxisAngles(1), 50, 40);
    expect(top.y).toBeCloseTo(30, 6);
  });

  /*
   * A point outside the outer ring is drawn outside the chart's box and
   * clipped by the viewBox, so an over-max value would simply disappear.
   */
  it('clamps an overshoot to the outer ring', () => {
    const [top] = radarValuePoints([50], 10, radarAxisAngles(1), 50, 40);
    expect(top.y).toBeCloseTo(10, 6);
  });

  it('puts a missing or unusable value at the centre', () => {
    const points = radarValuePoints([Number.NaN], 10, radarAxisAngles(2), 50, 40);
    expect(points[0].y).toBeCloseTo(50, 6);
    expect(points[1].y).toBeCloseTo(50, 6);
    expect(points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))).toBe(
      true,
    );
  });

  it('survives a max of zero', () => {
    const [point] = radarValuePoints([5], 0, radarAxisAngles(1), 50, 40);
    expect(Number.isFinite(point.y)).toBe(true);
  });
});
