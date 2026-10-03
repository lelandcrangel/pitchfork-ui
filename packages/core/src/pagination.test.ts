import { describe, expect, it } from 'vitest';

import { clampPage, getPaginationItems } from './pagination';

const items = (current: number, total: number, siblings = 1, boundaries = 1) =>
  getPaginationItems(current, total, siblings, boundaries);

describe('clampPage', () => {
  it('keeps a page inside the range', () => {
    expect(clampPage(3, 10)).toBe(3);
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(99, 10)).toBe(10);
  });

  /* A pager always shows something, so there is no page zero to report. */
  it('reports page 1 when there are no pages', () => {
    expect(clampPage(5, 0)).toBe(1);
    expect(clampPage(5, -3)).toBe(1);
    expect(clampPage(5, Number.NaN)).toBe(1);
  });
});

describe('getPaginationItems', () => {
  it('lists every page when the window covers them all', () => {
    // 1 boundary + 1 sibling either side of the current page reaches all three.
    expect(items(1, 3)).toEqual([1, 2, 3]);
    expect(items(2, 3)).toEqual([1, 2, 3]);
    expect(items(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('opens a gap on the right when the current page is near the start', () => {
    expect(items(1, 10)).toEqual([1, 2, 'ellipsis-right', 10]);
  });

  it('opens a gap on the left when the current page is near the end', () => {
    expect(items(10, 10)).toEqual([1, 'ellipsis-left', 9, 10]);
  });

  it('opens both gaps in the middle', () => {
    expect(items(5, 10)).toEqual([1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 10]);
  });

  /*
   * A gap opens wherever the window does not reach the boundary, even when
   * only one page is behind it: at 4 of 7 the left ellipsis stands in for page
   * 2 alone, and the right one for page 6 alone. An ellipsis that hides a
   * single page costs the same room as the page and says less, so this is a
   * wart rather than a decision — but it is the React component's behaviour,
   * and both layers now share this code, so changing it is a design call for
   * the system rather than a detail of the port. Recorded in todo.md.
   */
  /*
   * An ellipsis costs the same room as the page it stands for and says less,
   * so a gap hiding exactly one page shows the page. Both of these used to
   * open gaps: `1 … 3 4 5 … 7` for the first, where each ellipsis hid a single
   * page, and `1 2 … 4` for the second.
   */
  it('shows the page rather than a gap that would hide one', () => {
    expect(items(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(items(1, 4)).toEqual([1, 2, 3, 4]);
  });

  /*
   * Found while fixing the single-page gap, and older than it: at 1 of 6 with
   * `boundaryCount: 3` the two boundaries meet in the middle, and the run was
   * `1 2 3 … 4 5 6` — an ellipsis standing between two consecutive pages,
   * because the old arithmetic compared the window against the boundary edges
   * rather than asking which pages were actually missing.
   */
  it('never opens a gap that hides nothing', () => {
    expect(items(1, 6, 0, 3)).toEqual([1, 2, 3, 4, 5, 6]);

    for (let total = 1; total <= 14; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        for (let sibling = 0; sibling <= 3; sibling += 1) {
          for (let boundary = 0; boundary <= 3; boundary += 1) {
            const run = items(current, total, sibling, boundary);
            const where = `${current}/${total} s${sibling} b${boundary}`;

            for (let index = 0; index < run.length; index += 1) {
              const item = run[index];
              if (typeof item === 'number') continue;

              const before = run[index - 1];
              const after = run[index + 1];
              // A gap has to hide at least one page: either it sits between
              // two pages at least two apart, or it runs off an end.
              const hides =
                typeof before === 'number' && typeof after === 'number'
                  ? after - before > 1
                  : typeof after === 'number'
                    ? after > 1
                    : typeof before === 'number' && before < total;
              expect(hides, `${where}: ${JSON.stringify(run)}`).toBe(true);
            }
          }
        }
      }
    }
  });

  it('still opens a gap that hides two pages or more', () => {
    expect(items(5, 9)).toEqual([1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 9]);
    expect(items(4, 8)).toEqual([1, 2, 3, 4, 5, 'ellipsis-right', 8]);
  });

  /*
   * The run can get one item longer on each side, never more: collapsing adds
   * exactly the one page the gap stood for, in place of the gap itself. Worth
   * pinning, because the widest run is what a pager has to lay out.
   */
  it('grows a collapsed run by at most one item per side', () => {
    for (let total = 1; total <= 14; total += 1) {
      for (let current = 1; current <= total; current += 1) {
        for (let sibling = 0; sibling <= 3; sibling += 1) {
          for (let boundary = 0; boundary <= 3; boundary += 1) {
            const run = items(current, total, sibling, boundary);
            const widest = Math.min(total, 2 * boundary + 2 * sibling + 3);
            expect(run.length, `${current}/${total} s${sibling} b${boundary}`).toBeLessThanOrEqual(
              widest,
            );
          }
        }
      }
    }
  });

  it('never repeats a boundary page that is also a sibling', () => {
    const result = items(2, 5);
    const numbers = result.filter((item): item is number => typeof item === 'number');

    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('widens the window with siblingCount', () => {
    // The left gap would have hidden only page 2, so it collapses; the right
    // one hides 8..19 and stays.
    expect(items(5, 20, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, 'ellipsis-right', 20]);
    expect(items(6, 20, 2)).toEqual([1, 'ellipsis-left', 4, 5, 6, 7, 8, 'ellipsis-right', 20]);
  });

  it('pins more pages at each end with boundaryCount', () => {
    expect(items(10, 20, 0, 2)).toEqual([1, 2, 'ellipsis-left', 10, 'ellipsis-right', 19, 20]);
  });

  it('treats a negative siblingCount or boundaryCount as zero', () => {
    expect(items(5, 10, -1, -1)).toEqual(['ellipsis-left', 5, 'ellipsis-right']);
  });

  it('clamps a current page outside the range before building the run', () => {
    expect(items(99, 10)).toEqual(items(10, 10));
    expect(items(-5, 10)).toEqual(items(1, 10));
  });

  it('returns a single page for the degenerate totals', () => {
    expect(items(1, 0)).toEqual([1]);
    expect(items(1, 1)).toEqual([1]);
    expect(items(1, -4)).toEqual([1]);
  });

  /*
   * Swept rather than sampled, because these are the properties the renderers
   * rely on and a sampled test misses the corner that breaks them. The sweep
   * also establishes that the `[1]` fallback in the implementation is
   * unreachable — deleting it changes no result anywhere in this space, which
   * is why the comment there calls it insurance rather than a path.
   */
  it('holds its invariants across the whole input space', () => {
    let checked = 0;

    for (let total = -3; total <= 12; total += 1) {
      for (let current = -3; current <= 15; current += 1) {
        for (let siblings = -2; siblings <= 4; siblings += 1) {
          for (let boundaries = -2; boundaries <= 4; boundaries += 1) {
            const run = items(current, total, siblings, boundaries);
            const numbers = run.filter((item): item is number => typeof item === 'number');
            const safeTotal = Math.max(total, 1);

            expect(run.length).toBeGreaterThan(0);
            // Strictly increasing: no repeats, no going backwards.
            for (let i = 1; i < numbers.length; i += 1) {
              expect(numbers[i]).toBeGreaterThan(numbers[i - 1]);
            }
            // Every page offered is a page that exists.
            for (const page of numbers) {
              expect(page).toBeGreaterThanOrEqual(1);
              expect(page).toBeLessThanOrEqual(safeTotal);
            }
            // At most one gap per side, and never two in a row.
            expect(run.filter((item) => item === 'ellipsis-left').length).toBeLessThanOrEqual(1);
            expect(run.filter((item) => item === 'ellipsis-right').length).toBeLessThanOrEqual(1);
            for (let i = 1; i < run.length; i += 1) {
              expect(typeof run[i] === 'string' && typeof run[i - 1] === 'string').toBe(false);
            }
            checked += 1;
          }
        }
      }
    }

    expect(checked).toBe(16 * 19 * 7 * 7);
  });
});
