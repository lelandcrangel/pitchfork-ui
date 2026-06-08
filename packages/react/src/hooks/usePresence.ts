import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface UsePresence {
  /** Whether the element should be rendered (true while open and while exiting). */
  isMounted: boolean;
  /** True while the exit animation is playing — apply your `--exiting` class. */
  isExiting: boolean;
}

/**
 * Keeps a conditionally-rendered element mounted long enough to play an exit
 * animation. Drive it with the `present` prop (e.g. a Modal's `open`): when it
 * flips to false, the element stays mounted with `isExiting` true for `duration`
 * ms, then unmounts. Reduced motion unmounts immediately.
 */
export function usePresence(present: boolean, duration = 200): UsePresence {
  const [isExiting, setIsExiting] = useState(false);
  const wasPresent = useRef(false);

  useEffect(() => {
    if (present) {
      wasPresent.current = true;
      return;
    }
    if (!wasPresent.current || prefersReducedMotion()) {
      return;
    }
    wasPresent.current = false;
    // Begin the exit animation, then unmount after it finishes.
    setIsExiting(true);
    const timer = window.setTimeout(() => setIsExiting(false), duration);
    return () => window.clearTimeout(timer);
  }, [present, duration]);

  // `isExiting` only applies while closed; reopening mid-exit cancels it.
  const exiting = !present && isExiting;
  return { isMounted: present || exiting, isExiting: exiting };
}
