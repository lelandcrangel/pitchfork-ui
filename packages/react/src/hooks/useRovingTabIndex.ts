import {
  getRovingItems,
  resolveListMove,
  resolveRovingKey,
  syncRovingTabIndex,
} from '@pitchfork-ui/core';
import { useEffect, type RefObject } from 'react';

export type RovingOrientation = 'horizontal' | 'vertical';

export interface UseRovingTabIndexOptions {
  /** The container whose focusable children form the group. */
  ref: RefObject<HTMLElement | null>;
  /** Which axis the arrows move along. Defaults to `'horizontal'`. */
  orientation?: RovingOrientation;
}

/**
 * One tab stop for a group of controls, with the arrows moving inside it.
 *
 * The ARIA toolbar pattern, and the adapter shape every hook here takes: core
 * owns the selector, the index arithmetic and which key means what; this owns
 * the effect and hands back the two handlers to spread onto the container.
 *
 * Extracted from `Toolbar`, which had these three functions inline, when
 * `RichTextEditor`'s own `role="toolbar"` needed the same ones. Copying them
 * would have been the third place in this repo with the same five lines — and
 * the element layer already keeps `pf-toolbar` and
 * `pf-rich-text-editor`'s toolbar on one implementation.
 */
export function useRovingTabIndex({ ref, orientation = 'horizontal' }: UseRovingTabIndexOptions) {
  const getItems = () => (ref.current ? getRovingItems(ref.current) : []);

  /*
   * Every render, so items added or removed since the last one are brought
   * back to exactly one tab stop. Core keeps an established stop rather than
   * resetting it, so this never moves the user's place.
   */
  useEffect(() => {
    syncRovingTabIndex(getItems());
  });

  /** Moves the stop to whatever the user actually focused. */
  const onFocus: React.FocusEventHandler<HTMLElement> = (event) => {
    syncRovingTabIndex(getItems(), event.target as HTMLElement);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    if (event.defaultPrevented) return;

    const action = resolveRovingKey(event.key, orientation);
    if (!action) return;

    const items = getItems();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    const nextIndex = resolveListMove(
      action,
      items.map((_, index) => index),
      currentIndex,
    );
    if (nextIndex >= 0) {
      event.preventDefault();
      items[nextIndex].focus();
    }
  };

  return { onFocus, onKeyDown };
}
