/**
 * The geometry of a sparkline: where each value sits in the box, and the two
 * paths drawn through those points.
 *
 * Shared because it is arithmetic, and because a React `Sparkline` and a
 * `<pf-sparkline>` drawing the same numbers differently would be two charts
 * wearing one name.
 */

export interface SparklineBox {
  width: number;
  height: number;
  /** Room left for the stroke, so a line at the edge is not clipped. */
  padding: number;
}

/** A point in the SVG's own coordinates. */
export type SparklinePoint = [x: number, y: number];

/**
 * Where each value sits.
 *
 * Three edge cases, each of which the React `Sparkline` got wrong:
 *
 * - **One value** divided by `data.length - 1`, which is zero, so `x` came out
 *   `NaN` and an `endDot` rendered `cx="NaN"`. A single value has no line, so
 *   it goes in the middle of the box, where a dot for it belongs.
 * - **Every value equal** fell to the `max - min || 1` guard and put the whole
 *   series on one edge of the box — the bottom, which reads as a collapse
 *   rather than as "no change". A flat series is centred.
 * - **No values** is an empty list, which is the one it did handle.
 */
export function sparklinePoints(
  data: readonly number[],
  { width, height, padding }: SparklineBox,
): SparklinePoint[] {
  if (data.length === 0) return [];
  if (data.length === 1) return [[width / 2, height / 2]];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  // A flat series has no shape, so it sits in the middle rather than on an edge.
  if (max === min) {
    return data.map((_, index) => [padding + (index / (data.length - 1)) * innerWidth, height / 2]);
  }

  const range = max - min;
  return data.map((value, index) => [
    padding + (index / (data.length - 1)) * innerWidth,
    padding + (1 - (value - min) / range) * innerHeight,
  ]);
}

/** The line through the points, or `''` when there is no line to draw. */
export function sparklineLinePath(points: readonly SparklinePoint[]): string {
  if (points.length < 2) return '';

  const [first, ...rest] = points;
  return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`)].join(' ');
}

/**
 * The same line, closed down to `bottom` and back, for the filled variant.
 *
 * A separate function rather than a flag on `sparklineLinePath`, because the
 * React version's `buildPath(points, close = false)` took one and its closing
 * branch interpolated the **boolean** into the path (`L ${lastX} ${close}`).
 * It was never reached — every call site passed one argument — so the broken
 * branch sat there looking like working code, and the area path was written
 * out a second time inline.
 */
export function sparklineAreaPath(points: readonly SparklinePoint[], bottom: number): string {
  if (points.length < 2) return '';

  const line = sparklineLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L ${last[0]} ${bottom} L ${first[0]} ${bottom} Z`;
}
