/**
 * The arithmetic behind a two-panel splitter: what a pointer position means
 * as a percentage, what a key does to it, and what it is clamped into.
 *
 * Shared because every part of it is visible to a consumer, and because a
 * splitter's keys depend on its orientation — a React `Resizable` and a
 * `<pf-resizable>` that disagreed about which arrow grows the first panel
 * would be two controls wearing one name.
 */
import { clampNumber } from './number-field';

export type SplitterOrientation = 'horizontal' | 'vertical';

export interface SplitterBounds {
  /** The first panel's smallest share, in percent. */
  min?: number;
  /** Its largest. */
  max?: number;
}

export interface SplitterKeyState extends SplitterBounds {
  orientation: SplitterOrientation;
  /** The first panel's current share, in percent. */
  size: number;
  /** How far one key press moves it, in percent. */
  step?: number;
}

/**
 * Keeps a size inside min..max, in percent.
 *
 * A size that is not a finite number becomes an even split *of the bounds*
 * rather than `NaN`. It matters because `NaN` survives arithmetic silently and
 * then reaches the DOM as `flex-basis: NaN%`, an invalid declaration that
 * collapses the panel — the same failure mode as an undefined custom property,
 * and just as hard to read back from the result.
 */
export function clampSplitSize(size: number, { min = 0, max = 100 }: SplitterBounds = {}): number {
  if (!Number.isFinite(size)) return clampNumber((min + max) / 2, min, max);
  return clampNumber(size, min, max);
}

/**
 * Where a pointer sits along a container, as the first panel's share.
 *
 * `null` when the container has no length, which is not a hypothetical: a
 * splitter inside a closed disclosure, or one dragged before its first
 * layout, measures zero, and dividing by it gives `Infinity` — or `NaN` when
 * the pointer is at the container's own edge. The caller keeps the size it
 * had instead.
 */
export function splitSizeFromPointer(
  position: number,
  start: number,
  length: number,
  bounds: SplitterBounds = {},
): number | null {
  if (!(length > 0)) return null;
  return clampSplitSize(Math.round(((position - start) / length) * 100), bounds);
}

/**
 * What a key does to the size, or `null` for a key the splitter does not
 * handle — which is also the signal not to call `preventDefault`.
 *
 * Which arrows apply follows the orientation: side-by-side panels are grown
 * and shrunk with Left and Right, stacked ones with Up and Down. The other
 * pair is deliberately not handled, so Up and Down still scroll a page with a
 * horizontal splitter focused. Home and End jump to the bounds, which is the
 * only way to collapse a panel in one press.
 */
export function resolveSplitterKey(key: string, state: SplitterKeyState): number | null {
  const { orientation, size, step = 2, min = 0, max = 100 } = state;
  const current = clampSplitSize(size, { min, max });
  const decrease = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const increase = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

  if (key === decrease) return clampSplitSize(current - step, { min, max });
  if (key === increase) return clampSplitSize(current + step, { min, max });
  if (key === 'Home') return clampSplitSize(min, { min, max });
  if (key === 'End') return clampSplitSize(max, { min, max });
  return null;
}
