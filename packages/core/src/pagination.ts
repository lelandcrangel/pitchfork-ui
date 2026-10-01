/**
 * Which page numbers a pager shows, and where the gaps fall.
 *
 * Framework-free because it is entirely arithmetic, and shared because the two
 * layers must agree: a React `Pagination` and a `<pf-pagination>` given the
 * same page and total that offered different page buttons would be two
 * different components wearing one name.
 */

/** A page number, or a gap standing in for the pages skipped over. */
export type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

/**
 * Keep `page` inside 1..totalPages. A total of zero or less has no page to
 * land on, so it reports page 1 — a pager always shows something.
 */
export function clampPage(page: number, totalPages: number): number {
  if (!(totalPages > 0)) return 1;

  return Math.min(Math.max(page, 1), totalPages);
}

/**
 * The run of items to render: `boundaryCount` pages pinned at each end,
 * `siblingCount` pages either side of the current one, and an ellipsis
 * wherever that leaves a gap.
 *
 * The `[1]` fallback at the end is insurance, not a path: an exhaustive sweep
 * of total -3..12 x current -3..15 x sibling -2..4 x boundary -2..4 never
 * produces an empty run, and `pagination.test.ts` re-runs that sweep. It stays
 * because a pager with no buttons would read as broken, and the loops below
 * are the kind of thing an edit could leave empty.
 */
export function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  const safeTotal = Math.max(totalPages, 1);
  const safeCurrent = clampPage(currentPage, safeTotal);
  const safeSiblingCount = Math.max(siblingCount, 0);
  const safeBoundaryCount = Math.max(boundaryCount, 0);

  const leftBoundaryEnd = Math.min(safeBoundaryCount, safeTotal);
  const rightBoundaryStart = Math.max(safeTotal - safeBoundaryCount + 1, 1);

  const start = Math.max(safeCurrent - safeSiblingCount, leftBoundaryEnd + 1);
  const end = Math.min(safeCurrent + safeSiblingCount, rightBoundaryStart - 1);

  const items: PaginationItem[] = [];

  for (let page = 1; page <= leftBoundaryEnd; page += 1) {
    items.push(page);
  }

  if (start > leftBoundaryEnd + 1) {
    items.push('ellipsis-left');
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < rightBoundaryStart - 1) {
    items.push('ellipsis-right');
  }

  for (let page = rightBoundaryStart; page <= safeTotal; page += 1) {
    if (page > leftBoundaryEnd) {
      items.push(page);
    }
  }

  return items.length > 0 ? items : [1];
}
