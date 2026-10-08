/**
 * Which item in a navigation is the current page.
 *
 * Shared because `aria-current="page"` identifies *one* thing, and because
 * both the header and the sidebar navigation — and both rendering layers of
 * each — have to agree on which one.
 */

/** The part of a navigation item this resolution needs. */
export interface NavItemLike {
  current?: boolean;
}

/**
 * The index of the current item: the first one marked `current`, or `-1` when
 * none is.
 *
 * One index rather than a per-item answer, which is what stops a navigation
 * claiming two current pages — the same defect `resolveCurrentCrumb` exists
 * to prevent, found the same way. The React `HeaderNavigation` and
 * `SidebarNavigation` read `item.active` per item, so two active items put
 * `aria-current="page"` on both and a screen reader announced the reader as
 * being on two pages at once.
 *
 * The fallback differs from a breadcrumb trail's deliberately: the last crumb
 * in a trail *is* the page you are on, so it is current by default, while
 * every item in a navigation points somewhere you are not. Nothing is current
 * until an item says so.
 */
export function resolveCurrentNavItem(items: readonly NavItemLike[]): number {
  return items.findIndex((item) => item.current);
}
