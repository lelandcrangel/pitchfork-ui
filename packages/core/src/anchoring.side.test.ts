import { describe, expect, it } from 'vitest';

import { computeSidePosition, observeSidePosition, type Rect, type Side } from './anchoring';

const rect = (left: number, top: number, width: number, height: number): Rect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const VIEWPORT = { width: 1000, height: 800 };
// A 40x20 anchor in the middle of a roomy viewport: every side fits.
const ROOMY = rect(480, 390, 40, 20);
const FLOATING = rect(0, 0, 100, 40);

const at = (side: Side, anchor = ROOMY, viewport = VIEWPORT) =>
  computeSidePosition(anchor, FLOATING, viewport, { side });

describe('computeSidePosition', () => {
  it('honours the requested side when it fits', () => {
    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      expect(at(side).side).toBe(side);
    }
  });

  it('centres on the cross axis', () => {
    // Anchor centre is x=500; a 100-wide tooltip starts at 450.
    expect(at('top').left).toBe(450);
    expect(at('bottom').left).toBe(450);
    // Anchor centre is y=400; a 40-tall tooltip starts at 380.
    expect(at('left').top).toBe(380);
    expect(at('right').top).toBe(380);
  });

  it('places the element clear of the anchor by the offset', () => {
    // Default offset is 10. Anchor spans y 390..410.
    expect(at('top').top).toBe(390 - 40 - 10);
    expect(at('bottom').top).toBe(410 + 10);
    expect(at('left').left).toBe(480 - 100 - 10);
    expect(at('right').left).toBe(520 + 10);
  });

  it('respects a custom offset', () => {
    const { top } = computeSidePosition(ROOMY, FLOATING, VIEWPORT, { side: 'bottom', offset: 0 });
    expect(top).toBe(410);
  });

  /* The opposite side first: flipping keeps the element on the same axis. */
  it('flips to the opposite side when the preferred one has no room', () => {
    const nearTop = rect(480, 4, 40, 20);
    expect(at('top', nearTop).side).toBe('bottom');

    const nearBottom = rect(480, 776, 40, 20);
    expect(at('bottom', nearBottom).side).toBe('top');

    const nearLeft = rect(4, 390, 40, 20);
    expect(at('left', nearLeft).side).toBe('right');

    const nearRight = rect(956, 390, 40, 20);
    expect(at('right', nearRight).side).toBe('left');
  });

  it('falls through to a perpendicular side when neither of the pair fits', () => {
    // A viewport only a little taller than the anchor: no room above or below.
    const squat = { width: 1000, height: 70 };
    const anchor = rect(480, 25, 40, 20);

    expect(['left', 'right']).toContain(at('top', anchor, squat).side);
  });

  it('keeps the preferred side on a tie rather than reordering', () => {
    // Dead centre: every side overflows by zero, so the request stands.
    expect(at('right').side).toBe('right');
    expect(at('left').side).toBe('left');
  });

  /*
   * Clamping happens after the side is chosen, because even the winning side
   * can overflow — and half off-screen is worse than nudged. It takes a
   * viewport with no good placement at all to reach this: my first attempt
   * used a roomy viewport, where the fallback simply found a side that fit and
   * no clamping was needed.
   */
  it('clamps the winning side when it still overflows', () => {
    // 120x70 viewport, 100x40 tooltip: nothing fits cleanly anywhere.
    const cramped = { width: 120, height: 70 };
    const anchor = rect(0, 25, 10, 20);
    const { side, left } = computeSidePosition(anchor, FLOATING, cramped, { side: 'top' });

    // `right` overflows least (by 8), so it wins at left=20 and is pulled to 12.
    expect(side).toBe('right');
    expect(left).toBe(12);
    expect(left + FLOATING.width).toBeLessThanOrEqual(cramped.width - 8);
  });

  /*
   * Least overflow wins, not the first candidate that happens to fit better
   * than the request. For a 40x20 anchor at (20,10) with a 100x40 tooltip the
   * overflows are top 66, bottom 18, left 106, right 8 — so `right` is chosen
   * from every starting side, skipping the opposite one.
   */
  it('prefers the least-overflowing side over the opposite one', () => {
    const anchor = rect(20, 10, 40, 20);

    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      expect(at(side, anchor).side).toBe('right');
    }
  });

  it('pins rather than inverting when the element is wider than the viewport', () => {
    const narrow = { width: 50, height: 800 };
    const { left } = computeSidePosition(rect(10, 390, 30, 20), FLOATING, narrow, {
      side: 'top',
    });

    // max < min, so the clamp must not produce a value above the minimum.
    expect(left).toBe(8);
  });

  it('respects a custom viewportPadding', () => {
    const anchor = rect(0, 390, 10, 20);
    const { left } = computeSidePosition(anchor, FLOATING, VIEWPORT, {
      side: 'top',
      viewportPadding: 20,
    });

    expect(left).toBe(20);
  });

  it('defaults to the top side', () => {
    expect(computeSidePosition(ROOMY, FLOATING, VIEWPORT).side).toBe('top');
  });

  /* Whatever it returns has to be on screen, or the element is unusable. */
  it('never places the element outside the padded viewport, across the grid', () => {
    let checked = 0;
    for (const x of [0, 10, 200, 500, 800, 990]) {
      for (const y of [0, 10, 200, 400, 700, 790]) {
        for (const side of ['top', 'bottom', 'left', 'right'] as const) {
          const { left, top } = computeSidePosition(rect(x, y, 40, 20), FLOATING, VIEWPORT, {
            side,
          });
          expect(left).toBeGreaterThanOrEqual(8);
          expect(top).toBeGreaterThanOrEqual(8);
          expect(left + FLOATING.width).toBeLessThanOrEqual(VIEWPORT.width - 8);
          expect(top + FLOATING.height).toBeLessThanOrEqual(VIEWPORT.height - 8);
          checked += 1;
        }
      }
    }
    expect(checked).toBe(6 * 6 * 4);
  });
});

describe('observeSidePosition', () => {
  const mount = () => {
    document.body.innerHTML = `
      <div id="anchor" style="position:fixed;left:400px;top:300px;width:40px;height:20px"></div>
      <div id="floating" style="position:fixed;width:100px;height:40px"></div>`;
    return {
      anchor: document.getElementById('anchor') as HTMLElement,
      floating: document.getElementById('floating') as HTMLElement,
    };
  };

  /*
   * jsdom gives every element a zero rect, so these assert the plumbing — that
   * it computes once eagerly, recomputes on scroll and resize, and unbinds —
   * rather than the geometry, which `computeSidePosition` covers directly.
   */
  it('computes once immediately, so the element is placed before any event', () => {
    const { anchor, floating } = mount();
    const seen: unknown[] = [];

    const stop = observeSidePosition({
      getAnchor: () => anchor,
      getFloating: () => floating,
      onChange: (position) => seen.push(position),
    });

    expect(seen).toHaveLength(1);
    stop();
  });

  it('recomputes on resize and on a scroll anywhere in the tree', () => {
    const { anchor, floating } = mount();
    let calls = 0;

    const stop = observeSidePosition({
      getAnchor: () => anchor,
      getFloating: () => floating,
      onChange: () => {
        calls += 1;
      },
    });
    expect(calls).toBe(1);

    window.dispatchEvent(new Event('resize'));
    expect(calls).toBe(2);

    // Capture phase: a scroll on a descendant has to count.
    anchor.dispatchEvent(new Event('scroll', { bubbles: false }));
    expect(calls).toBe(3);

    stop();
  });

  it('stops listening once cleaned up', () => {
    const { anchor, floating } = mount();
    let calls = 0;

    const stop = observeSidePosition({
      getAnchor: () => anchor,
      getFloating: () => floating,
      onChange: () => {
        calls += 1;
      },
    });
    stop();

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));

    expect(calls).toBe(1);
  });

  /* Nothing to place until both rects exist, so it must not call back. */
  it('does not report a position while either element is missing', () => {
    const { floating } = mount();
    let calls = 0;

    const stop = observeSidePosition({
      getAnchor: () => null,
      getFloating: () => floating,
      onChange: () => {
        calls += 1;
      },
    });

    expect(calls).toBe(0);
    stop();
  });
});
