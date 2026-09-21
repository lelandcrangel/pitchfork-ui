/**
 * Whether the user has asked for reduced motion. Guarded for non-browser
 * environments and for `matchMedia`-less test doubles, both of which report
 * "no preference" rather than throwing.
 */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
