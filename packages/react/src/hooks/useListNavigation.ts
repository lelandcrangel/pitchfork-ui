import {
  getEnabledIndexes,
  getNextEnabledIndex as resolveNextEnabledIndex,
  resolveListMove,
  type ListNavigationAction,
} from '@pitchfork-ui/core';
import { useCallback, useMemo, useState } from 'react';

export type { ListNavigationAction };

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
  const enabledIndexes = useMemo(() => getEnabledIndexes(items, isDisabled), [isDisabled, items]);

  const firstEnabledIndex = enabledIndexes[0] ?? -1;
  const lastEnabledIndex = enabledIndexes[enabledIndexes.length - 1] ?? -1;
  const [activeIndex, setActiveIndex] = useState(initialIndex ?? firstEnabledIndex);

  const getNextEnabledIndex = useCallback(
    (startIndex: number, direction: 1 | -1) =>
      resolveNextEnabledIndex(enabledIndexes, startIndex, direction),
    [enabledIndexes],
  );

  const move = useCallback(
    (action: ListNavigationAction, currentIndex = activeIndex) => {
      const nextIndex = resolveListMove(action, enabledIndexes, currentIndex);

      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
      }

      return nextIndex;
    },
    [activeIndex, enabledIndexes],
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
