/**
 * Which crumb in a trail is the current page.
 *
 * Shared because `aria-current="page"` identifies *one* thing, and the rule
 * for finding it — the crumb that says so, or the last one — has to be the
 * same in both layers or they announce different pages for the same trail.
 */

/** The part of a crumb this resolution needs. */
export interface BreadcrumbLike {
  current?: boolean;
}

/**
 * The index of the current crumb: the first one marked `current`, or the last
 * crumb when none is. `-1` for an empty trail.
 *
 * One index rather than a per-crumb answer, because that is what stops a trail
 * marking two pages. The React `Breadcrumbs` read `item.current ?? isLast` per
 * item, which marked both the explicitly-current crumb *and* the last one as
 * soon as a consumer marked anything but the last — so a screen reader was
 * told the user was on two pages at once.
 */
export function resolveCurrentCrumb(crumbs: readonly BreadcrumbLike[]): number {
  const explicit = crumbs.findIndex((crumb) => crumb.current);
  if (explicit >= 0) return explicit;
  return crumbs.length - 1;
}
