import { animationsFinished, prefersReducedMotion } from '@pitchfork-ui/core';
import { useCallback, useRef, useState } from 'react';

export interface UseExitAnimationOptions {
  /** Called once the exit animation has finished, or immediately if there is none. */
  onExited?: () => void;
}

export interface UseExitAnimation<T extends HTMLElement = HTMLElement> {
  /** True while the exit animation is playing — apply your `--exiting` class. */
  isExiting: boolean;
  /** Trigger the exit: plays the animation, then calls `onExited`. */
  startExit: () => void;
  /** Attach to the element the exit animation runs on. */
  ref: React.RefObject<T | null>;
}

/**
 * Plays an exit animation before signalling removal.
 *
 * It **waits for the animation** rather than for a number. This used to take a
 * `duration` and `setTimeout` on it, defaulting to 220ms — a guess that went
 * stale the moment a stylesheet's duration changed, fired early where the
 * animation was slower, and fired late everywhere it was faster or absent.
 * `animationsFinished` asks the element what is actually running, which also
 * covers the three ordinary ways for nothing to be running at all: reduced
 * motion setting `animation: none`, a consumer who has not loaded the
 * stylesheet, and a test environment that applies none.
 *
 * Attach `ref` to the element the animation runs on, which is the one the
 * `isExiting` class goes to.
 */
export function useExitAnimation<T extends HTMLElement = HTMLElement>({
  onExited,
}: UseExitAnimationOptions = {}): UseExitAnimation<T> {
  const [isExiting, setIsExiting] = useState(false);
  const ref = useRef<T | null>(null);

  const startExit = useCallback(() => {
    if (prefersReducedMotion()) {
      onExited?.();
      return;
    }

    setIsExiting(true);
    // The class lands on the next render; `animationsFinished` waits a frame
    // before asking, so the animation it finds is the exit one.
    void animationsFinished(ref.current).then(() => onExited?.());
  }, [onExited]);

  return { isExiting, startExit, ref };
}
