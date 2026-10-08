/**
 * The geometry of a radar chart: where each axis points, and the polygons
 * drawn across them.
 *
 * Shared because it is trigonometry, and because the grid rings and the value
 * polygon only line up if both were built from the same centre, radius and
 * angles.
 */

export interface RadarPoint {
  x: number;
  y: number;
}

/** A radar needs at least three axes to enclose anything. */
export const RADAR_MINIMUM_AXES = 3;

/** What a radar needs of a datum. */
export interface RadarDatumLike {
  value: number;
}

/** A point at `radius` from the centre, along `angle` in radians. */
export function polarPoint(center: number, radius: number, angle: number): RadarPoint {
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

/**
 * The angle of each axis, in radians, evenly spaced.
 *
 * The first points **up**, not right: a radar whose first axis is at three
 * o'clock reads as rotated, and every radar anyone has seen starts at the
 * top. In SVG that is `-π/2`, because y grows downwards.
 */
export function radarAxisAngles(count: number): number[] {
  if (!(count > 0)) return [];

  const step = (2 * Math.PI) / count;
  return Array.from({ length: count }, (_, index) => -Math.PI / 2 + index * step);
}

/**
 * The axes worth drawing: the ones with a usable value.
 *
 * A value that is not a number is dropped, since `NaN >= 0` is false — which
 * is also what the React `RadarChart` relied on, by accident rather than by
 * saying so.
 */
export function usableRadarAxes<T extends RadarDatumLike>(data: readonly T[]): T[] {
  return data.filter((item) => Number.isFinite(item.value) && item.value >= 0);
}

/**
 * The scale's top.
 *
 * The explicit `max` wins, even when a value exceeds it — a consumer who set
 * a scale means it, and the polygon is clamped to the outer ring instead.
 * Otherwise the largest value, never below 1, so a chart of all zeroes has a
 * grid rather than a division by zero.
 */
export function radarMax(data: readonly RadarDatumLike[], explicit?: number): number {
  if (typeof explicit === 'number' && explicit > 0) return explicit;

  const largest = Math.max(...usableRadarAxes(data).map((item) => item.value), 1);
  return largest > 0 ? largest : 1;
}

/** Points as an SVG `points` attribute, rounded to two places. */
export function pointsToAttribute(points: readonly RadarPoint[]): string {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

/**
 * The grid rings, outermost last, as `points` attributes.
 *
 * `levels` rings, the last of which is the outer edge — so a four-level radar
 * has rings at 25%, 50%, 75% and 100% and the outermost doubles as the
 * chart's boundary. Never fewer than two, or there is no grid to read a value
 * against.
 */
export function radarGridPolygons(
  angles: readonly number[],
  center: number,
  radius: number,
  levels: number,
): string[] {
  const rings = Math.max(2, Math.floor(levels) || 2);

  return Array.from({ length: rings }, (_, index) => {
    const ratio = (index + 1) / rings;
    return pointsToAttribute(angles.map((angle) => polarPoint(center, radius * ratio, angle)));
  });
}

/**
 * Where each value lands, clamped into the grid.
 *
 * Clamped rather than allowed to overshoot, because a point outside the outer
 * ring is drawn outside the chart's own box and clipped by the viewBox: a
 * value above `max` would simply disappear.
 */
export function radarValuePoints(
  values: readonly number[],
  max: number,
  angles: readonly number[],
  center: number,
  radius: number,
): RadarPoint[] {
  const top = max > 0 ? max : 1;

  return angles.map((angle, index) => {
    const value = values[index];
    const ratio = Number.isFinite(value) ? Math.max(0, Math.min(1, value / top)) : 0;
    return polarPoint(center, radius * ratio, angle);
  });
}
