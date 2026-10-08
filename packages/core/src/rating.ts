/**
 * The arithmetic behind a star rating.
 *
 * Shared because both of this library's rating components clamp and both fill
 * stars, and because a half star is a judgement: 3.5 out of 5 has to fill the
 * fourth star by the same amount in a React `RatingStars` and in a
 * `<pf-rating-stars>`, or the same rating looks like two different ones.
 */

/**
 * Keeps a rating inside 0..max, so a star cannot be more or less than full.
 *
 * `NaN` is no rating rather than a clamped one: `Math.min(Math.max(NaN, 0), 5)`
 * is `NaN`, which the React component then rendered as the text "NaN" and as a
 * `NaN%` CSS width. An infinite rating is simply the maximum.
 */
export function clampRating(value: number, max: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), Math.max(max, 0));
}

/**
 * How much of the star at `index` (counting from 0) is filled, as a whole
 * percentage.
 *
 * Rounded, because the value is written into a CSS width and a long fraction
 * there buys nothing. A value at or past the star is full, a value short of
 * it is empty, and anything between fills by its fractional part — so 3.5
 * fills the fourth star halfway rather than rounding it to a whole star,
 * which is the whole point of showing a fraction.
 */
export function starFillPercent(value: number, index: number): number {
  const position = index + 1;
  if (value >= position) return 100;
  if (value > index) return Math.round((value - index) * 100);
  return 0;
}

/**
 * A rating as it is written down: one decimal place, always — `4.0` rather
 * than `4`, so a row of ratings lines up and none of them looks like a
 * different kind of number.
 *
 * Deliberately not locale-aware. The badge puts this either side of a `/`
 * where a decimal comma would read as a second separator, and the two layers
 * have to produce the same string for the same rating.
 */
export function formatRating(value: number): string {
  return clampRating(value, Number.POSITIVE_INFINITY).toFixed(1);
}
