/**
 * How a table sorts: what a cell's value counts as, how two of them compare,
 * and which way the next click turns.
 *
 * Shared because the comparison is a decision a consumer sees in the order of
 * their own rows. "Item 2" sorting before "Item 10" is the numeric collation
 * asked for here, not something either layer should be free to change on its
 * own.
 */

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

/** What a cell counts as when sorting: a number, a time, or text. */
export type SortValue = string | number | Date | null | undefined;

/**
 * Normalises a cell's value to something comparable: a `Date` becomes its
 * time, a number stays one, and everything else becomes text — with nothing
 * at all becoming the empty string, so a missing cell sorts to one end rather
 * than throwing.
 */
export function normalizeSortValue(value: SortValue): string | number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Compares two cell values in `direction`.
 *
 * Two numbers compare numerically; anything else goes through
 * `localeCompare` with `numeric: true` and a base sensitivity, which is what
 * sorts "Item 2" before "Item 10" and ignores case and accents. The two rules
 * together are why this is shared: a table that collated differently from its
 * own documentation would be worse than one that did not sort at all.
 */
export function compareSortValues(
  left: SortValue,
  right: SortValue,
  direction: SortDirection = 'asc',
): number {
  const factor = direction === 'asc' ? 1 : -1;
  const a = normalizeSortValue(left);
  const b = normalizeSortValue(right);

  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * factor;
  }

  return (
    String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }) * factor
  );
}

/**
 * The sort state a click on `key` produces.
 *
 * A new column starts ascending — which is what a reader expects of a column
 * they have just asked about — and clicking the current column turns it round.
 */
export function nextSortState(current: SortState | undefined, key: string): SortState {
  if (current?.key !== key) return { key, direction: 'asc' };
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

/** The `aria-sort` value for a column, given the table's sort state. */
export function ariaSortFor(
  current: SortState | undefined,
  key: string,
): 'ascending' | 'descending' | 'none' {
  if (current?.key !== key) return 'none';
  return current.direction === 'asc' ? 'ascending' : 'descending';
}

/**
 * Sorts rows by a column, without disturbing the array it was given.
 *
 * `getValue` is the caller's, because only it knows where a cell's value
 * lives — a row object's key in React, a cell element's text in the custom
 * element.
 */
export function sortRowsBy<T>(
  rows: readonly T[],
  getValue: (row: T) => SortValue,
  direction: SortDirection,
): T[] {
  return [...rows].sort((left, right) =>
    compareSortValues(getValue(left), getValue(right), direction),
  );
}
