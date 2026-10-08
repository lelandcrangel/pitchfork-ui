import { noop } from './internal';

export interface OutsideInteractionOptions {
  /** Read fresh on every event, so containers that mount later still count as "inside". */
  getContainers: () => Array<HTMLElement | null | undefined>;
  onInteractOutside: (event: PointerEvent | MouseEvent) => void;
  eventName?: 'mousedown' | 'pointerdown';
}

/**
 * Calls back when a pointer interaction lands outside every container. Returns
 * a cleanup function.
 *
 * Containment is tested with `contains`, which does not see through a shadow
 * boundary: an event from inside a shadow root reports its host as the target,
 * so this is correct for light-DOM components and will need `composedPath()`
 * when a component moves into a shadow root.
 */
export function onOutsideInteraction({
  getContainers,
  onInteractOutside,
  eventName = 'pointerdown',
}: OutsideInteractionOptions): () => void {
  if (typeof document === 'undefined') {
    return noop;
  }

  const handleEvent = (event: PointerEvent | MouseEvent) => {
    const target = event.target as Node;
    const isInside = getContainers().some((container) => container?.contains(target));

    if (!isInside) {
      onInteractOutside(event);
    }
  };

  document.addEventListener(eventName, handleEvent);

  return () => {
    document.removeEventListener(eventName, handleEvent);
  };
}
