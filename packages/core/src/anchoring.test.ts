import { describe, expect, it } from 'vitest';
import { computeAnchoredPosition, type Rect } from './anchoring';

const rect = (partial: Partial<Rect>): Rect => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0,
  ...partial,
});

const viewport = { width: 1000, height: 800 };

describe('computeAnchoredPosition', () => {
  const anchor = rect({ top: 100, bottom: 130, left: 200, right: 400, width: 200, height: 30 });

  it('sits below the anchor, offset by the gap', () => {
    expect(computeAnchoredPosition(anchor, undefined, viewport).top).toBe(138);
  });

  it('aligns to the anchor start edge by default', () => {
    expect(computeAnchoredPosition(anchor, undefined, viewport).left).toBe(200);
  });

  it('aligns the right edges when align is "end"', () => {
    const floating = rect({ width: 300, height: 100 });
    const { left } = computeAnchoredPosition(anchor, floating, viewport, { align: 'end' });
    expect(left).toBe(anchor.right - 300);
  });

  it('matches the anchor width via width, leaving minWidth unset', () => {
    const { width, minWidth } = computeAnchoredPosition(anchor, undefined, viewport);
    expect(width).toBe(200);
    expect(minWidth).toBeUndefined();
  });

  it('sets minWidth instead when matchAnchorWidth is false', () => {
    const { width, minWidth } = computeAnchoredPosition(anchor, undefined, viewport, {
      matchAnchorWidth: false,
      minWidth: 120,
    });
    expect(width).toBeUndefined();
    expect(minWidth).toBe(120);
  });

  it('takes the widest of anchor, minWidth and the floating element', () => {
    const floating = rect({ width: 420, height: 50 });
    expect(computeAnchoredPosition(anchor, floating, viewport, { minWidth: 300 }).width).toBe(420);
  });

  it('keeps the floating element inside the right edge', () => {
    const nearEdge = rect({ top: 10, bottom: 40, left: 900, right: 990, width: 90, height: 30 });
    const floating = rect({ width: 300, height: 100 });
    const { left } = computeAnchoredPosition(nearEdge, floating, viewport);
    expect(left).toBe(viewport.width - 8 - 300);
  });

  it('pins to the padding when the element is wider than the viewport allows', () => {
    const floating = rect({ width: 2000, height: 100 });
    expect(computeAnchoredPosition(anchor, floating, viewport).left).toBe(8);
  });

  it('does not clamp vertically before the floating height is known', () => {
    const low = rect({ top: 780, bottom: 795, left: 10, right: 110, width: 100, height: 15 });
    expect(computeAnchoredPosition(low, undefined, viewport).top).toBe(803);
  });

  it('clamps into the viewport once the floating height is known', () => {
    const low = rect({ top: 700, bottom: 730, left: 10, right: 110, width: 100, height: 30 });
    const floating = rect({ width: 100, height: 200 });
    const { top } = computeAnchoredPosition(low, floating, viewport);
    expect(top).toBe(viewport.height - 8 - 200);
  });

  it('flips above the anchor when asked and there is no room below', () => {
    const low = rect({ top: 700, bottom: 730, left: 10, right: 110, width: 100, height: 30 });
    const floating = rect({ width: 100, height: 200 });
    const { top } = computeAnchoredPosition(low, floating, viewport, { flip: true });
    expect(top).toBe(700 - 200 - 8);
  });

  it('stays below when flipping is enabled but there is room', () => {
    const floating = rect({ width: 100, height: 100 });
    const { top } = computeAnchoredPosition(anchor, floating, viewport, { flip: true });
    expect(top).toBe(anchor.bottom + 8);
  });

  it('honours a custom offset and viewport padding', () => {
    const { top, left } = computeAnchoredPosition(
      rect({ top: 10, bottom: 40, left: -50, right: 50, width: 100, height: 30 }),
      rect({ width: 100, height: 50 }),
      viewport,
      { offset: 20, viewportPadding: 30 },
    );
    expect(top).toBe(60);
    expect(left).toBe(30);
  });
});
