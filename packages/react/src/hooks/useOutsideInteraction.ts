import { onOutsideInteraction } from '@pitchfork-ui/core';
import { useEffect } from 'react';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `onOutsideInteraction` from `@pitchfork-ui/core` — or nothing: `<pf-popover>` is a `popover="auto"`, which light-dismisses itself. */
export interface UseOutsideInteractionOptions {
  refs: Array<React.RefObject<HTMLElement | null>>;
  enabled?: boolean;
  onInteractOutside: (event: PointerEvent | MouseEvent) => void;
  eventName?: 'mousedown' | 'pointerdown';
}

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `onOutsideInteraction` from `@pitchfork-ui/core` — or nothing: `<pf-popover>` is a `popover="auto"`, which light-dismisses itself. */
export function useOutsideInteraction({
  refs,
  enabled = true,
  onInteractOutside,
  eventName = 'pointerdown',
}: UseOutsideInteractionOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    return onOutsideInteraction({
      getContainers: () => refs.map((ref) => ref.current),
      onInteractOutside,
      eventName,
    });
  }, [enabled, eventName, onInteractOutside, refs]);
}
