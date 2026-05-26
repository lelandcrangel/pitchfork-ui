import { useCallback, useMemo, useState } from 'react';

export type ListNavigationAction = 'first' | 'last' | 'next' | 'previous';

export interface UseListNavigationOptions<T> {
  items: T[];
  isDisabled?: (item: T, index: number) => boolean;
  initialIndex?: number;
}

export function useListNavigation<T>({
  items,
  isDisabled = () => false,
  initialIndex,
}: UseListNavigationOptions<T>) {
  const enabledIndexes = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ item, index }) => !isDisabled(item, index))
        .map(({ index }) => index),
    [isDisabled, items],
  );

  const firstEnabledIndex = enabledIndexes[0] ?? -1;
  const lastEnabledIndex = enabledIndexes[enabledIndexes.length - 1] ?? -1;
  const [activeIndex, setActiveIndex] = useState(
    initialIndex ?? firstEnabledIndex,
  );

  const getNextEnabledIndex = useCallback(
    (startIndex: number, direction: 1 | -1) => {
      if (enabledIndexes.length === 0) {
        return -1;
      }

      const currentEnabledPosition = enabledIndexes.indexOf(startIndex);
      const fallbackPosition = direction === 1 ? -1 : 0;
      const safePosition =
        currentEnabledPosition === -1
          ? fallbackPosition
          : currentEnabledPosition;
      const nextPosition =
        (safePosition + direction + enabledIndexes.length) %
        enabledIndexes.length;

      return enabledIndexes[nextPosition] ?? -1;
    },
    [enabledIndexes],
  );

  const move = useCallback(
    (action: ListNavigationAction, currentIndex = activeIndex) => {
      const nextIndex =
        action === 'first'
          ? firstEnabledIndex
          : action === 'last'
            ? lastEnabledIndex
            : getNextEnabledIndex(currentIndex, action === 'next' ? 1 : -1);

      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
      }

      return nextIndex;
    },
    [activeIndex, firstEnabledIndex, getNextEnabledIndex, lastEnabledIndex],
  );

  return {
    activeIndex,
    enabledIndexes,
    firstEnabledIndex,
    lastEnabledIndex,
    getNextEnabledIndex,
    move,
    setActiveIndex,
  };
}
