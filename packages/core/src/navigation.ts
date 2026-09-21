export type ListNavigationAction = 'first' | 'last' | 'next' | 'previous';

/** The indexes of `items` that are selectable, in source order. */
export function getEnabledIndexes<T>(
  items: T[],
  isDisabled: (item: T, index: number) => boolean = () => false,
): number[] {
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => !isDisabled(item, index))
    .map(({ index }) => index);
}

/**
 * Steps one place through `enabledIndexes`, wrapping at both ends. Returns -1
 * when nothing is selectable.
 *
 * A `startIndex` that is not itself enabled (a disabled item, or -1 before
 * anything is active) enters the list from the end the caller is moving away
 * from, so the first Down lands on the first item and the first Up on the last.
 */
export function getNextEnabledIndex(
  enabledIndexes: number[],
  startIndex: number,
  direction: 1 | -1,
): number {
  if (enabledIndexes.length === 0) {
    return -1;
  }

  const currentEnabledPosition = enabledIndexes.indexOf(startIndex);
  const fallbackPosition = direction === 1 ? -1 : 0;
  const safePosition = currentEnabledPosition === -1 ? fallbackPosition : currentEnabledPosition;
  const nextPosition = (safePosition + direction + enabledIndexes.length) % enabledIndexes.length;

  return enabledIndexes[nextPosition] ?? -1;
}

/** Resolves a navigation action to the index it should land on, or -1. */
export function resolveListMove(
  action: ListNavigationAction,
  enabledIndexes: number[],
  currentIndex: number,
): number {
  if (action === 'first') {
    return enabledIndexes[0] ?? -1;
  }

  if (action === 'last') {
    return enabledIndexes[enabledIndexes.length - 1] ?? -1;
  }

  return getNextEnabledIndex(enabledIndexes, currentIndex, action === 'next' ? 1 : -1);
}
