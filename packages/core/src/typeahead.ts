/**
 * Printable-character typeahead for a listbox, menu or tree.
 *
 * The ARIA listbox pattern expects it: typing `b` jumps to the next option
 * beginning with `b`, and typing `br` narrows to `br`. The React `Select` has
 * none of this — `todo.md` has the fix — so the rules live here, where
 * `<pf-select>` and every later `pf-combobox` / `pf-multi-select` /
 * `pf-tree-view` read the same ones.
 *
 * Core owns the matching; the rendering layer owns the buffer and its timer,
 * because a timer is state and core is never a state container.
 */

/** How long a quiet gap ends one typeahead word, in milliseconds. */
export const TYPEAHEAD_TIMEOUT_MS = 500;

/**
 * Whether a key should go into the buffer at all.
 *
 * One character, so `Enter`, `ArrowDown` and `Escape` are excluded by length
 * rather than by a list that would need keeping up to date. A space is
 * deliberately *not* typeahead: in a listbox it selects.
 */
export function isTypeaheadKey(key: string): boolean {
  return key.length === 1 && key !== ' ';
}

/**
 * The buffer after `key`: lower-cased and appended, nothing more.
 *
 * A repeat is *not* special-cased here. Pressing `b` four times means "the
 * fourth option starting with b" rather than "an option starting with bbbb",
 * but that is a matching question, so `findTypeaheadMatch` reads it off the
 * buffer's shape instead — which keeps this function a plain append and lets
 * the caller hold one string.
 */
export function nextTypeaheadBuffer(buffer: string, key: string): string {
  if (!isTypeaheadKey(key)) return buffer;
  return buffer + key.toLowerCase();
}

/**
 * True when the buffer is one character repeated — including just once.
 *
 * The single-character case is the important one, and requiring two got it
 * wrong: pressing `b` while already on Banana has to move to Blackberry, the
 * way a native `<select>` does, not sit still because Banana also starts with
 * `b`. Found by a browser test on `pf-select`.
 */
function isCycling(buffer: string): boolean {
  return buffer.length > 0 && [...buffer].every((char) => char === buffer[0]);
}

/**
 * The index of the option the buffer points at, or -1.
 *
 * Searches from `fromIndex` and wraps, so a match behind the current option is
 * still found. Two modes:
 *
 * - **Narrowing** (`br`): the current option is included, because typing more
 *   of the label you are already on should keep you there rather than skip to
 *   the next `br`.
 * - **Cycling** (`b`, `bb`, `bbb`): one character repeated, searched from
 *   *after* the current option — so pressing one letter walks through the
 *   options beginning with it, which is what a native `<select>` does.
 *
 * A disabled option is never matched: the keyboard would land somewhere it
 * cannot act, which is worse than not moving.
 */
export function findTypeaheadMatch(
  labels: string[],
  buffer: string,
  fromIndex = -1,
  isDisabled: (index: number) => boolean = () => false,
): number {
  if (!buffer || labels.length === 0) return -1;

  const cycling = isCycling(buffer);
  const needle = cycling ? buffer[0] : buffer;

  /*
   * Three cases, and collapsing them into one offset got it wrong: with no
   * current option the search has to *include* index 0, and an early version
   * skipped it, so `ap` found Apricot instead of Apple.
   */
  const start = fromIndex < 0 ? 0 : cycling ? fromIndex + 1 : fromIndex;

  for (let step = 0; step < labels.length; step += 1) {
    const index = (start + step) % labels.length;
    if (isDisabled(index)) continue;
    if (labels[index]?.trim().toLowerCase().startsWith(needle)) return index;
  }

  return -1;
}
