import { describe, expect, it } from 'vitest';

import { clampToViewport } from './anchoring';

const VIEWPORT = { width: 1000, height: 800 };
const MENU = { width: 200, height: 300 };

describe('clampToViewport', () => {
  it('leaves a point that already fits alone', () => {
    expect(clampToViewport({ x: 100, y: 100 }, MENU, VIEWPORT)).toEqual({ x: 100, y: 100 });
  });

  it('pulls a point back from the right and bottom edges', () => {
    expect(clampToViewport({ x: 950, y: 700 }, MENU, VIEWPORT)).toEqual({ x: 792, y: 492 });
  });

  it('pushes a negative point in to the padding', () => {
    expect(clampToViewport({ x: -40, y: -40 }, MENU, VIEWPORT)).toEqual({ x: 8, y: 8 });
  });

  it('respects a custom padding', () => {
    expect(clampToViewport({ x: 0, y: 0 }, MENU, VIEWPORT, 20)).toEqual({ x: 20, y: 20 });
  });

  /*
   * Pinned, not inverted: a right-click near the bottom puts the menu just
   * above that edge rather than jumping it above the cursor, because the
   * pointer is already where the user is looking.
   */
  it('pins to the padding rather than flipping around the point', () => {
    const { y } = clampToViewport({ x: 100, y: 790 }, MENU, VIEWPORT);

    expect(y).toBe(800 - 300 - 8);
    expect(y).toBeLessThan(790);
  });

  it('pins to the minimum when the element is larger than the viewport', () => {
    const huge = { width: 2000, height: 2000 };

    expect(clampToViewport({ x: 500, y: 500 }, huge, VIEWPORT)).toEqual({ x: 8, y: 8 });
  });

  it('keeps the element inside the padded viewport across the grid', () => {
    let checked = 0;
    for (const x of [-50, 0, 200, 500, 900, 1200]) {
      for (const y of [-50, 0, 200, 500, 700, 1100]) {
        const point = clampToViewport({ x, y }, MENU, VIEWPORT);
        expect(point.x).toBeGreaterThanOrEqual(8);
        expect(point.y).toBeGreaterThanOrEqual(8);
        expect(point.x + MENU.width).toBeLessThanOrEqual(VIEWPORT.width - 8);
        expect(point.y + MENU.height).toBeLessThanOrEqual(VIEWPORT.height - 8);
        checked += 1;
      }
    }
    expect(checked).toBe(36);
  });
});
