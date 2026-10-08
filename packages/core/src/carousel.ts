/**
 * Which slide a carousel lands on, and what it says it is showing.
 *
 * Shared because looping is a decision: stepping past the last slide either
 * wraps to the first or stays put, and a React `Carousel` and a
 * `<pf-carousel>` that disagreed would be two components wearing one name.
 */

/**
 * The slide `next` resolves to, out of `total`.
 *
 * With `loop` it wraps at both ends — including from a negative index, which
 * is what stepping back from the first slide gives, and which a bare `%` in
 * JavaScript gets wrong: `-1 % 5` is `-1`, not `4`. Without it the index is
 * clamped. An empty carousel has no slide to land on and reports `-1`.
 */
export function resolveSlideIndex(next: number, total: number, loop = false): number {
  if (!(total > 0)) return -1;
  if (!Number.isFinite(next)) return 0;

  const index = Math.trunc(next);
  if (loop) return ((index % total) + total) % total;
  return Math.min(Math.max(index, 0), total - 1);
}

/**
 * What a carousel announces, which is the one thing a reader who cannot see it
 * has to go on: "Slide 2 of 5".
 *
 * Here rather than in either layer because it is read out, and two layers
 * announcing the same carousel differently would be two different controls to
 * a screen reader.
 */
export function slidePositionLabel(index: number, total: number): string {
  if (!(total > 0)) return 'No slides';
  const resolved = resolveSlideIndex(index, total);
  return `Slide ${resolved + 1} of ${total}`;
}
