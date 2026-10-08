/**
 * The arithmetic behind a stepper field: how far one step moves, what the
 * result is rounded to, and what it is clamped into.
 *
 * Shared because every part of it is a decision a consumer can see. A step of
 * `0.1` has to land on `0.3` rather than `0.30000000000000004`, an empty field
 * stepped up has to start somewhere sensible, and a React `NumberInput` and a
 * `<pf-number-input>` that disagreed about either would be two controls
 * wearing one name.
 */

export interface NumberStepOptions {
  min?: number;
  max?: number;
  step?: number;
}

/**
 * How many decimal places a step has, which is what its results are rounded
 * to.
 *
 * Read off the number's own text, so `0.1` gives 1 and `0.25` gives 2. A step
 * written in exponential notation — `1e-7`, which `String()` keeps that way —
 * has no decimal point to count and reports 0; that is a step no stepper can
 * usefully take anyway, and reporting 0 keeps the rounding harmless rather
 * than throwing.
 */
export function decimalsOf(step: number): number {
  const text = String(step);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** Keeps a value inside min..max. An unordered pair clamps to `min`. */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds to the step's own precision, which is what keeps repeated stepping
 * from drifting: ten steps of `0.1` reach exactly `1`, where the raw sum is
 * `0.9999999999999999`.
 */
export function roundToStep(value: number, step: number): number {
  const factor = 10 ** decimalsOf(step);
  return Math.round(value * factor) / factor;
}

/**
 * Where one step from `current` lands, clamped and rounded.
 *
 * An empty field has to start somewhere: the nearer bound if there is one —
 * stepping up from empty in a 10..20 field gives 11, not 1 — and zero when
 * the field is unbounded.
 */
export function stepNumber(
  current: number | null,
  direction: 1 | -1,
  { min = -Infinity, max = Infinity, step = 1 }: NumberStepOptions = {},
): number {
  const start = current ?? (Number.isFinite(min) ? min : Number.isFinite(max) ? max : 0);
  return roundToStep(clampNumber(start + direction * step, min, max), step);
}

/**
 * Reads what someone typed, or `null` for an empty field.
 *
 * `null` rather than `0`, because a field someone has cleared is not a field
 * holding zero — a form reading one as the other is the bug this prevents.
 * Anything unparseable is also `null`, which a caller treats as "leave the
 * value alone".
 */
export function parseNumberValue(raw: string): number | null {
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export interface NumberFormatOptions {
  locale?: string | string[];
  format?: Intl.NumberFormatOptions;
}

/**
 * The value as it is shown while the field is *not* being edited — thousands
 * separators, a currency symbol, whatever the consumer asked for.
 *
 * Without `format` the plain number is used rather than the locale's default,
 * because a field that reads `1,234` and then has to be parsed back is a
 * round-trip a consumer did not ask for.
 */
export function formatNumberValue(
  value: number | null,
  { locale, format }: NumberFormatOptions = {},
): string {
  if (value === null || !Number.isFinite(value)) return '';
  if (!format) return String(value);
  return new Intl.NumberFormat(locale, format).format(value);
}
