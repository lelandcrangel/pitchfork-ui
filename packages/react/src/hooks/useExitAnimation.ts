import { useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface UseExitAnimationOptions {
  /** Called once the exit animation has finished (or immediately if reduced motion). */
  onExited?: () => void;
  /** Exit animation duration in ms. Should match the CSS animation duration. Defaults to 220. */
  duration?: number;
}

export interface UseExitAnimation {
  /** True while the exit animation is playing — apply your `--exiting` class. */
  isExiting: boolean;
  /** Trigger the exit: plays the animation, then calls `onExited`. */
  startExit: () => void;
}

/**
 * Plays an exit animation before signalling removal. Apply `isExiting` to a CSS
 * class that runs the exit keyframes; `onExited` fires after `duration`. When the
 * user prefers reduced motion, `onExited` fires immediately with no animation.
 */
export function useExitAnimation({
  onExited,
  duration = 220,
}: UseExitAnimationOptions = {}): UseExitAnimation {
  const [isExiting, setIsExiting] = useState(false);

  const startExit = () => {
    if (prefersReducedMotion()) {
      onExited?.();
      return;
    }
    setIsExiting(true);
    window.setTimeout(() => onExited?.(), duration);
  };

  return { isExiting, startExit };
}
