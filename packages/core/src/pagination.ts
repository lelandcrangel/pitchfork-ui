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
 * wherever that leaves pages genuinely hidden.
 *
 * Built by collecting the pages to show and then walking them, rather than by
 * placing gaps from the window's indexes. The index version got two cases
 * wrong, both of which this shape cannot express:
 *
 * - **A gap standing for nothing.** At 1 of 6 with `boundaryCount: 3` the two
 *   boundaries meet in the middle, and it still emitted `1 2 3 … 4 5 6` — an
 *   ellipsis between two consecutive pages, because it compared the window
 *   against the boundary edges rather than asking which pages were actually
 *   missing.
 * - **A gap hiding exactly one page.** An ellipsis costs the same room as the
 *   page it stands for and says less, so `1 … 3 4 5 … 7` is strictly worse
 *   than `1 2 3 4 5 6 7`. A single-page hole is filled instead.
 *
 * The `[1]` fallback at the end is insurance, not a path: the window always
 * contains the clamped current page, so `shown` is never empty. It stays
 * because a pager with no buttons would read as broken.
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

  const shown = new Set<number>();
  const add = (page: number) => {
    if (page >= 1 && page <= safeTotal) shown.add(page);
  };

  for (let page = 1; page <= Math.min(safeBoundaryCount, safeTotal); page += 1) add(page);
  for (let page = safeTotal - safeBoundaryCount + 1; page <= safeTotal; page += 1) add(page);
  for (
    let page = safeCurrent - safeSiblingCount;
    page <= safeCurrent + safeSiblingCount;
    page += 1
  ) {
    add(page);
  }

  const pages = [...shown].sort((a, b) => a - b);

  // Fill every hole of exactly one page, before deciding where the gaps are.
  for (let index = 0; index < pages.length - 1; index += 1) {
    if (pages[index + 1] - pages[index] === 2) add(pages[index] + 1);
  }
  if (pages[0] === 2) add(1);
  if (pages[pages.length - 1] === safeTotal - 1) add(safeTotal);

  const finalPages = [...shown].sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  /*
   * Which side a gap is labelled is about where it sits relative to the
   * current page, not about the window: with `boundaryCount: 0` there is no
   * page 1 to the left of it at all, and `['ellipsis-left', 5,
   * 'ellipsis-right']` is still the right answer.
   */
  const gapFor = (nextPage: number): PaginationItem =>
    nextPage <= safeCurrent ? 'ellipsis-left' : 'ellipsis-right';

  if (finalPages.length > 0 && finalPages[0] > 1) {
    items.push(gapFor(finalPages[0]));
  }

  for (let index = 0; index < finalPages.length; index += 1) {
    items.push(finalPages[index]);
    const next = finalPages[index + 1];
    if (next !== undefined && next - finalPages[index] > 1) items.push(gapFor(next));
  }

  if (finalPages.length > 0 && finalPages[finalPages.length - 1] < safeTotal) {
    items.push('ellipsis-right');
  }

  return items.length > 0 ? items : [1];
}
