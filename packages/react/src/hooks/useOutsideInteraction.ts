import { useEffect } from 'react';

export interface UseOutsideInteractionOptions {
  refs: Array<React.RefObject<HTMLElement | null>>;
  enabled?: boolean;
  onInteractOutside: (event: PointerEvent | MouseEvent) => void;
  eventName?: 'mousedown' | 'pointerdown';
}

export function useOutsideInteraction({
  refs,
  enabled = true,
  onInteractOutside,
  eventName = 'pointerdown',
}: UseOutsideInteractionOptions) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return;
    }

    const handleEvent = (event: PointerEvent | MouseEvent) => {
      const target = event.target as Node;
      const isInside = refs.some((ref) => ref.current?.contains(target));

      if (!isInside) {
        onInteractOutside(event);
      }
    };

    document.addEventListener(eventName, handleEvent);
    return () => {
      document.removeEventListener(eventName, handleEvent);
    };
  }, [enabled, eventName, onInteractOutside, refs]);
}
