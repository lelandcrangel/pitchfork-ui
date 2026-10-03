import { describe, expect, it } from 'vitest';
import { clampSplitSize, resolveSplitterKey, splitSizeFromPointer } from './splitter';

describe('clampSplitSize', () => {
  it('leaves a size inside the bounds alone', () => {
    expect(clampSplitSize(40, { min: 10, max: 90 })).toBe(40);
  });

  it('clamps to either bound', () => {
    expect(clampSplitSize(5, { min: 10, max: 90 })).toBe(10);
    expect(clampSplitSize(95, { min: 10, max: 90 })).toBe(90);
  });

  it('defaults to the whole range', () => {
    expect(clampSplitSize(120)).toBe(100);
    expect(clampSplitSize(-20)).toBe(0);
  });

  /*
   * NaN would survive the arithmetic and reach the DOM as `flex-basis: NaN%`,
   * an invalid declaration that collapses the panel.
   */
  it('turns a size that is not a number into an even split of the bounds', () => {
    expect(clampSplitSize(Number.NaN, { min: 20, max: 80 })).toBe(50);
    expect(clampSplitSize(Number.POSITIVE_INFINITY, { min: 0, max: 100 })).toBe(50);
    expect(clampSplitSize(Number.NaN, { min: 60, max: 90 })).toBe(75);
  });
});

describe('splitSizeFromPointer', () => {
  it('reads the pointer as a percentage of the container', () => {
    expect(splitSizeFromPointer(300, 100, 400)).toBe(50);
    expect(splitSizeFromPointer(200, 100, 400)).toBe(25);
  });

  it('clamps to the bounds', () => {
    expect(splitSizeFromPointer(110, 100, 400, { min: 20, max: 80 })).toBe(20);
    expect(splitSizeFromPointer(500, 100, 400, { min: 20, max: 80 })).toBe(80);
  });

  it('rounds to a whole percent', () => {
    expect(splitSizeFromPointer(133, 100, 400)).toBe(8);
  });

  /*
   * A splitter inside a closed disclosure, or one dragged before its first
   * layout, measures zero — and dividing by it gives Infinity, or NaN when
   * the pointer is at the container's own edge.
   */
  it('reports nothing for a container with no length', () => {
    expect(splitSizeFromPointer(100, 100, 0)).toBeNull();
    expect(splitSizeFromPointer(300, 100, -5)).toBeNull();
    expect(splitSizeFromPointer(300, 100, Number.NaN)).toBeNull();
  });
});

describe('resolveSplitterKey', () => {
  const horizontal = { orientation: 'horizontal' as const, size: 50, min: 10, max: 90 };
  const vertical = { orientation: 'vertical' as const, size: 50, min: 10, max: 90 };

  it('grows and shrinks side-by-side panels with left and right', () => {
    expect(resolveSplitterKey('ArrowRight', horizontal)).toBe(52);
    expect(resolveSplitterKey('ArrowLeft', horizontal)).toBe(48);
  });

  it('grows and shrinks stacked panels with up and down', () => {
    expect(resolveSplitterKey('ArrowDown', vertical)).toBe(52);
    expect(resolveSplitterKey('ArrowUp', vertical)).toBe(48);
  });

  /*
   * The other pair is not handled at all, so a page still scrolls with a
   * horizontal splitter focused.
   */
  it('leaves the other axis to the page', () => {
    expect(resolveSplitterKey('ArrowUp', horizontal)).toBeNull();
    expect(resolveSplitterKey('ArrowDown', horizontal)).toBeNull();
    expect(resolveSplitterKey('ArrowLeft', vertical)).toBeNull();
    expect(resolveSplitterKey('ArrowRight', vertical)).toBeNull();
  });

  it('takes a step of its own', () => {
    expect(resolveSplitterKey('ArrowRight', { ...horizontal, step: 10 })).toBe(60);
  });

  it('jumps to the bounds with Home and End', () => {
    expect(resolveSplitterKey('Home', horizontal)).toBe(10);
    expect(resolveSplitterKey('End', horizontal)).toBe(90);
  });

  it('stops at the bounds rather than passing them', () => {
    expect(resolveSplitterKey('ArrowLeft', { ...horizontal, size: 11 })).toBe(10);
    expect(resolveSplitterKey('ArrowRight', { ...horizontal, size: 89 })).toBe(90);
  });

  /* A size the consumer set outside the bounds steps from inside them. */
  it('steps from the clamped size', () => {
    expect(resolveSplitterKey('ArrowRight', { ...horizontal, size: 200 })).toBe(90);
    expect(resolveSplitterKey('ArrowLeft', { ...horizontal, size: Number.NaN })).toBe(48);
  });

  it('reports nothing for any other key', () => {
    expect(resolveSplitterKey('Enter', horizontal)).toBeNull();
    expect(resolveSplitterKey('a', horizontal)).toBeNull();
  });
});
