import { Keys } from './keys';
import type { ListNavigationAction } from './navigation';

/**
 * Roving tabindex: a group of controls that is one tab stop from the outside,
 * navigated internally with the arrow keys. Toolbars, radio groups and
 * segmented controls all work this way.
 *
 * Framework-free because the whole of it is DOM reads and index arithmetic.
 * Both layers must also agree on *which* descendants count as items — two
 * selectors that drift would give a toolbar whose keyboard order differs
 * between React and `<pf-toolbar>` for the same markup.
 */

/**
 * Interactive descendants, matched regardless of their current (roving)
 * tabindex. `[data-toolbar-item]` lets a consumer opt a custom element in,
 * since a custom element is not a native control.
 */
export const ROVING_ITEM_SELECTOR =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [data-toolbar-item]:not([aria-disabled="true"])';

/**
 * The items inside `container`, in source order.
 *
 * `querySelectorAll` reaches light-DOM descendants, which is where a custom
 * element's items are: they are slotted children, not shadow content.
 */
export function getRovingItems(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(ROVING_ITEM_SELECTOR));
}

/**
 * Leave exactly one item tabbable.
 *
 * `preferred` wins when it is one of the items; otherwise an existing tab stop
 * is kept, so re-running this never moves the user's place. Only as a last
 * resort does the first item become the tab stop.
 *
 * The existing stop is found by reading the `tabindex` *attribute*, not the
 * `tabIndex` property: a native button reports `tabIndex === 0` with no
 * attribute at all, so the property would make every untouched button look
 * like an established tab stop.
 */
export function syncRovingTabIndex(items: HTMLElement[], preferred?: HTMLElement | null): void {
  if (items.length === 0) return;

  const current =
    (preferred && items.includes(preferred) ? preferred : undefined) ??
    items.find((item) => item.getAttribute('tabindex') === '0');

  for (const [index, item] of items.entries()) {
    item.tabIndex = (current ? item === current : index === 0) ? 0 : -1;
  }
}

/**
 * The navigation a key means on a given axis, or null if the key is not ours
 * to handle — so a caller can leave every other key to the browser.
 *
 * A vertical group moves on Up/Down and a horizontal one on Left/Right;
 * neither claims the other axis, which leaves those arrows free to scroll or
 * to move a caret.
 */
export function resolveRovingKey(
  key: string,
  orientation: 'horizontal' | 'vertical',
): ListNavigationAction | null {
  const next = orientation === 'vertical' ? Keys.ArrowDown : Keys.ArrowRight;
  const previous = orientation === 'vertical' ? Keys.ArrowUp : Keys.ArrowLeft;

  if (key === next) return 'next';
  if (key === previous) return 'previous';
  if (key === Keys.Home) return 'first';
  if (key === Keys.End) return 'last';
  return null;
}
