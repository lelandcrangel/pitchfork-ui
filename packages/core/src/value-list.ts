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

/** Why a candidate tag was refused, or `null` when it was taken. */
export type TagRefusal = 'empty' | 'max' | 'duplicate' | 'invalid';

export interface AddTagOptions {
  /** Refuse once the list is this long. */
  max?: number;
  /** Allow the same tag twice. Comparison is case-insensitive. */
  allowDuplicates?: boolean;
  /** Refuse a candidate outright; the trimmed tag is passed. */
  validate?: (tag: string) => boolean;
}

export interface AddTagResult {
  tags: string[];
  /** Whether `tags` differs from what was passed in. */
  added: boolean;
  /** Set when nothing was added, so a caller can decide about the draft. */
  refusal: TagRefusal | null;
}

/**
 * Adds a tag, trimmed, if the list will take it.
 *
 * The refusal is reported rather than swallowed, because the four cases want
 * different handling and a boolean cannot tell them apart: a duplicate should
 * clear the draft, since the tag the user asked for is already there, while
 * hitting the maximum should leave it alone so nothing is lost.
 *
 * Deduplication is case-insensitive — `React` and `react` are one tag — which
 * is a decision rather than an accident, and the reason this is shared.
 */
export function addTag(
  tags: readonly string[],
  raw: string,
  options: AddTagOptions = {},
): AddTagResult {
  const tag = raw.trim();
  const refuse = (refusal: TagRefusal): AddTagResult => ({
    tags: [...tags],
    added: false,
    refusal,
  });

  if (!tag) return refuse('empty');
  if (options.max !== undefined && tags.length >= options.max) return refuse('max');
  if (options.validate && !options.validate(tag)) return refuse('invalid');

  const exists = tags.some((existing) => existing.toLowerCase() === tag.toLowerCase());
  if (exists && !options.allowDuplicates) return refuse('duplicate');

  return { tags: [...tags, tag], added: true, refusal: null };
}

/** Removes the tag at `index`, leaving the rest in order. */
export function removeTagAt(tags: readonly string[], index: number): string[] {
  return tags.filter((_, position) => position !== index);
}

/** Commas, newlines and tabs, which is what a pasted list is separated by. */
export const TAG_PASTE_PATTERN = /[,\n\t]/;

/** Splits pasted text into candidate tags; empty when there is nothing to split on. */
export function splitPastedTags(text: string): string[] {
  if (!TAG_PASTE_PATTERN.test(text)) return [];
  return text
    .split(/[,\n\t]+/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
}
