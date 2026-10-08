/**
 * Whether the user has asked for reduced motion. Guarded for non-browser
 * environments and for `matchMedia`-less test doubles, both of which report
 * "no preference" rather than throwing.
 */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Resolves once every animation on `element` has finished, or straight away
 * when there is not one.
 *
 * `getAnimations()` is the only reliable way to ask, and this is the only
 * honest way to wait. The alternatives all fail in ordinary situations:
 *
 * - An `animationend` listener **waits forever** when no animation ever
 *   started, and there are three everyday ways for that to happen —
 *   `prefers-reduced-motion` setting `animation: none`, a consumer who has
 *   not loaded the stylesheet, and a test project that applies none.
 * - `getComputedStyle().animationName` reports whatever `animation` declared
 *   whether or not the `@keyframes` resolve, so it cannot tell a working
 *   animation from a missing one.
 * - A fixed timeout is a guess that goes stale the moment the CSS duration
 *   changes, and fires early or late everywhere else. The React
 *   `useExitAnimation` waited a hard-coded 220ms for exactly this.
 *
 * A frame passes first, so a class or attribute applied in the same tick has
 * taken effect and the animation exists to be found. A cancelled animation
 * rejects, which is still "done".
 */
export async function animationsFinished(element: Element | null | undefined): Promise<void> {
  if (!element || typeof element.getAnimations !== 'function') return;

  await new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => resolve(undefined));
    else resolve(undefined);
  });

  const running = element.getAnimations().filter((animation) => animation.playState !== 'finished');
  if (running.length === 0) return;

  await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
}
