import { describe, expect, it } from 'vitest';
import {
  BUNDLED_FA_ICON_NAMES,
  CUSTOM_GLYPHS,
  type CustomGlyph,
  customGlyphAttributes,
  getCustomGlyphNames,
  resolveCustomGlyph,
} from './custom-glyphs';

/*
 * `CUSTOM_GLYPHS` is declared with `satisfies` so its keys stay literal, which
 * also narrows each entry to its own shape -- so a loop over the values cannot
 * read `filled` on an entry that does not set it. The index signature is the
 * view these assertions want.
 */
const glyphs: Record<string, CustomGlyph> = CUSTOM_GLYPHS;

describe('custom glyphs', () => {
  it('carries the thirteen glyphs Font Awesome regular does not', () => {
    expect(getCustomGlyphNames()).toEqual([
      'chevron-down',
      'chevron-left',
      'chevron-right',
      'chevron-up',
      'circle-info',
      'clock',
      'ellipsis',
      'file-arrow-down',
      'file-arrow-up',
      'magnifying-glass',
      'minus',
      'plus',
      'triangle-exclamation',
    ]);
  });

  it('resolves a name, and nothing for one it does not have', () => {
    expect(resolveCustomGlyph('chevron-down')?.shapes).toHaveLength(1);
    expect(resolveCustomGlyph('paper-plane')).toBeUndefined();
  });

  /*
   * SVG's initial `fill` is black, so a stroked glyph that does not set
   * `fill: none` draws a filled blob rather than a line. The attribute helper
   * is the only place either layer gets this from.
   */
  it('turns off the fill on a stroked glyph and the stroke on a filled one', () => {
    const stroked = customGlyphAttributes(glyphs['chevron-down']);
    expect(stroked.fill).toBe('none');
    expect(stroked.stroke).toBe('currentColor');
    expect(stroked.strokeWidth).toBe(3);

    const filled = customGlyphAttributes(glyphs.ellipsis);
    expect(filled.fill).toBe('currentColor');
    expect(filled.stroke).toBeUndefined();
    expect(filled.strokeWidth).toBeUndefined();
    expect(filled.strokeLinecap).toBeUndefined();
  });

  it('draws every glyph on the same 24-unit grid', () => {
    for (const glyph of Object.values(glyphs)) {
      expect(glyph.viewBox).toBe('0 0 24 24');
    }
  });

  /*
   * A stroked glyph with no width inherits the UA's 1, which is half the
   * lightest weight used here and reads as grey next to the others.
   */
  it('gives every stroked glyph a width, and every filled one none', () => {
    for (const [name, glyph] of Object.entries(glyphs)) {
      if (glyph.filled) expect(glyph.strokeWidth, name).toBeUndefined();
      else expect(glyph.strokeWidth, name).toBeGreaterThan(1);
    }
  });

  it('describes every shape with a kind both layers can render', () => {
    for (const [name, glyph] of Object.entries(glyphs)) {
      expect(glyph.shapes.length, name).toBeGreaterThan(0);
      for (const shape of glyph.shapes) {
        expect(['polyline', 'path', 'circle']).toContain(shape.kind);
        if (shape.kind === 'polyline') expect(shape.points).toMatch(/^[\d\s.]+$/);
        if (shape.kind === 'path') expect(shape.d.length).toBeGreaterThan(0);
        if (shape.kind === 'circle') expect(shape.r).toBeGreaterThan(0);
      }
    }
  });

  it('lists the Font Awesome names both layers bundle', () => {
    expect([...BUNDLED_FA_ICON_NAMES]).toEqual([...BUNDLED_FA_ICON_NAMES].slice().sort());
    expect(BUNDLED_FA_ICON_NAMES).toHaveLength(15);
    // A custom glyph and a bundled FA name must not claim the same name, or
    // which one draws depends on each layer's lookup order.
    for (const name of BUNDLED_FA_ICON_NAMES) {
      expect(glyphs[name], name).toBeUndefined();
    }
  });
});
