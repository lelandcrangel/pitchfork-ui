/**
 * Progress arithmetic, shared because both layers must agree.
 *
 * A React `ProgressBar` and a `<pf-progress-bar>` given `value=30 max=60` have
 * to report the same `aria-valuenow` and draw the same fill. Two copies of a
 * clamp drift the moment one of them is fixed, and the arc maths is worse: the
 * circle's stroke only lands on the right angle if the dash offset and the
 * circumference were computed from the same radius.
 */

/** The fraction of `max` that `value` represents, as a percentage in 0–100. */
export function clampProgressPercent(value: number, max: number): number {
  // A non-positive or NaN max has no meaningful fraction to take, and dividing
  // by it gives Infinity or NaN rather than a drawable number. (`!(max > 0)`
  // rather than `max <= 0` so NaN is caught too.)
  if (!(max > 0)) return 0;
  // Only NaN needs guarding on the value side: the clamp below already turns
  // Infinity into 100 and -Infinity into 0, which is what an overshoot and an
  // undershoot should each report.
  if (Number.isNaN(value)) return 0;

  return Math.max(0, Math.min(100, (value / max) * 100));
}

/**
 * The value to announce for a given percentage — rounded, because a screen
 * reader reading "aria-valuenow: 30.000000000000004" serves nobody.
 */
export function progressValueNow(percent: number, max: number): number {
  return Math.round((percent / 100) * max);
}

export interface ProgressCircleGeometry {
  /** Radius of the stroked circle, inset so the stroke stays inside the box. */
  radius: number;
  /** Full circumference, which is also the dash array length. */
  circumference: number;
  /** Dash offset that leaves `percent` of the circumference drawn. */
  dashOffset: number;
  /** Centre coordinate on both axes. */
  center: number;
}

/**
 * Geometry for a circular progress track.
 *
 * The radius is inset by half the stroke width because an SVG stroke straddles
 * the path: a circle of radius `size / 2` would have half its stroke painted
 * outside the viewBox and clipped.
 */
export function getProgressCircleGeometry(
  size: number,
  strokeWidth: number,
  percent: number,
): ProgressCircleGeometry {
  const radius = Math.max(0, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;

  return {
    radius,
    circumference,
    dashOffset: circumference * (1 - percent / 100),
    center: size / 2,
  };
}

export interface NormalizedRange {
  min: number;
  max: number;
  step: number;
}

/**
 * Sanitise a slider's bounds.
 *
 * Every rule here exists because the alternative renders nothing useful: a
 * non-finite bound gives a track of NaN width, an inverted range gives a
 * negative one, and a step of zero or less makes the control refuse every
 * value the user picks.
 */
export function normalizeRange(min: number, max: number, step: number): NormalizedRange {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : safeMin + 100;

  return {
    min: safeMin,
    // An inverted range collapses to a single point rather than reading
    // backwards, which is the only interpretation a track can draw.
    max: safeMax >= safeMin ? safeMax : safeMin,
    step: Number.isFinite(step) && step > 0 ? step : 1,
  };
}

/**
 * Where `value` sits between `min` and `max`, as a percentage in 0–100.
 *
 * Distinct from `clampProgressPercent`, which measures a fraction of `max`
 * from an implicit zero. A slider's track starts at `min`, so a value of 5 on
 * a 0–10 range and on a 5–15 range are 50% and 0% respectively.
 */
export function getRangePercent(value: number, min: number, max: number): number {
  const range = max - min;
  if (!(range > 0)) return 0;
  if (Number.isNaN(value)) return 0;

  return Math.max(0, Math.min(100, ((value - min) / range) * 100));
}

/** Keep `value` within the inclusive range. */
export function clampToRange(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;

  return Math.min(Math.max(value, min), max);
}
