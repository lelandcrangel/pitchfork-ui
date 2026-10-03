import {
  findTypeaheadMatch,
  isTypeaheadKey,
  nextTypeaheadBuffer,
  TYPEAHEAD_TIMEOUT_MS,
} from '@pitchfork-ui/core';
import { useCallback, useEffect, useRef } from 'react';

export interface UseTypeaheadOptions {
  /** The option labels, in source order. */
  labels: string[];
  isDisabled?: (index: number) => boolean;
  /** How long a quiet gap ends one typeahead word. Core's default is 500ms. */
  timeoutMs?: number;
}

/**
 * Printable-character typeahead for a listbox, menu or tree.
 *
 * A thin adapter in the usual shape: core owns the matching rules — including
 * the two that are easy to get wrong, that one letter repeated *cycles* while
 * two different letters *narrow*, and that a disabled option is never matched
 * — and this owns the buffer and its timer, because a timer is state and core
 * is never a state container. `<pf-select>` does the same thing with a private
 * field.
 *
 * **The buffer is a ref, not state.** It never reaches the DOM: what renders
 * is the active index the caller sets from the match. Holding it in state
 * would re-render on every keystroke to show exactly the same markup.
 */
export function useTypeahead({
  labels,
  isDisabled = () => false,
  timeoutMs = TYPEAHEAD_TIMEOUT_MS,
}: UseTypeaheadOptions) {
  const bufferRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTypeahead = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
    bufferRef.current = '';
  }, []);

  // A pending timer after unmount would fire into a dead component.
  useEffect(() => clearTypeahead, [clearTypeahead]);

  /*
   * Returns the index the buffer points at, or -1 for no match. Deliberately
   * does not move anything itself: what a match *means* differs by component
   * and by whether the list is open -- `Select` highlights when open and
   * chooses when closed, the way a native `<select>` does.
   */
  const onTypeaheadKey = useCallback(
    (key: string, fromIndex = -1): number => {
      if (!isTypeaheadKey(key)) return -1;

      bufferRef.current = nextTypeaheadBuffer(bufferRef.current, key);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(clearTypeahead, timeoutMs);

      return findTypeaheadMatch(labels, bufferRef.current, fromIndex, isDisabled);
    },
    [clearTypeahead, isDisabled, labels, timeoutMs],
  );

  return { onTypeaheadKey, clearTypeahead };
}
