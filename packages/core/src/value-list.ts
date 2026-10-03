/**
 * A multi-value control's value, as one string.
 *
 * Comma-separated, because that is what an HTML attribute can carry and what
 * `accept` and `sizes` already do — so `<pf-multi-select value="a,b">` works
 * in plain HTML, round-trips, and reflects. The consequence is that a value
 * containing a comma cannot be represented; option values are slugs in
 * practice, and `assertSeparableValues` below is how a mistake is reported
 * rather than silently mangled.
 *
 * Shared because `pf-multi-select` and `pf-tag-input` both need it, and
 * because the toggle rule — removing a value preserves the order of the rest —
 * is the kind of thing two copies would quietly disagree about.
 */

export const VALUE_LIST_SEPARATOR = ',';

/** Splits a stored value, dropping empties so `'a,,b'` is two values. */
export function parseValueList(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(VALUE_LIST_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

/** Joins values back, with no spaces, so the result parses to the same list. */
export function formatValueList(values: readonly string[]): string {
  return values.join(VALUE_LIST_SEPARATOR);
}

/**
 * Adds or removes one value.
 *
 * A value is appended at the end rather than in the options' own order, so the
 * list reads as what the user picked in the order they picked it; removing one
 * leaves the rest where they were.
 */
export function toggleValueInList(values: readonly string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

/**
 * The values that cannot survive a round trip through the separator.
 *
 * Returned rather than thrown, so a caller can warn once with every offender
 * named instead of failing on the first.
 */
export function assertSeparableValues(values: readonly string[]): string[] {
  return values.filter((value) => value.includes(VALUE_LIST_SEPARATOR));
}
