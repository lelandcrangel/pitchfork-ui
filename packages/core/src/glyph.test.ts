import { describe, expect, it } from 'vitest';
import {
  type FontAwesomeIconDefinition,
  type IconGlyph,
  type LucideIconNode,
  fromFontAwesome,
  fromLucide,
  glyphAttributes,
  glyphElements,
  toIconGlyph,
} from './glyph';

const regular: FontAwesomeIconDefinition = {
  prefix: 'far',
  iconName: 'chart-bar',
  // The codepoint is really there: Font Awesome types the list as strings and
  // ships numbers in it.
  icon: [512, 448, ['bar-chart', 61568 as unknown as string], 'f080', 'M32 32v384'],
};

/** Shaped like a Font Awesome Pro duotone definition: `[secondary, primary]`. */
const duotone: FontAwesomeIconDefinition = {
  prefix: 'fad',
  iconName: 'bell',
  icon: [448, 512, [], 'f0f3', ['M1 1h1', 'M2 2h2']],
};

/** Lucide's `X`, as the `lucide` package exports it. */
const lucideX: LucideIconNode = [
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }],
];

describe('fromFontAwesome', () => {
  it('takes the viewBox from the definition and fills the glyph', () => {
    const glyph = fromFontAwesome(regular);

    expect(glyph.viewBox).toBe('0 0 512 448');
    expect(glyph.filled).toBe(true);
    expect(glyph.shapes).toEqual([{ kind: 'path', d: 'M32 32v384' }]);
  });

  it('keeps the former names and drops the codepoints mixed in with them', () => {
    expect(fromFontAwesome(regular).aliases).toEqual(['bar-chart']);
  });

  it('keeps the definition, for a renderer that honours Font Awesome props', () => {
    expect(fromFontAwesome(regular).fontAwesome).toBe(regular);
  });

  /*
   * Font Awesome's own renderer draws `pathData[0]` as the secondary layer at
   * `--fa-secondary-opacity` (0.4) and `pathData[1]` as the primary, read from
   * fontawesome-svg-core 7.3.1. `<pf-icon>` used to draw both at full
   * opacity, which merges a duotone icon into one solid shape.
   */
  it('draws a duotone secondary layer at Font Awesome’s opacity, primary on top', () => {
    expect(fromFontAwesome(duotone).shapes).toEqual([
      { kind: 'path', d: 'M1 1h1', opacity: 0.4 },
      { kind: 'path', d: 'M2 2h2' },
    ]);
  });

  it('skips an empty duotone layer rather than drawing an empty path', () => {
    const primaryOnly: FontAwesomeIconDefinition = { icon: [10, 10, [], 'f000', ['', 'M1']] };

    expect(fromFontAwesome(primaryOnly).shapes).toEqual([{ kind: 'path', d: 'M1' }]);
  });
});

describe('fromLucide', () => {
  it('is a stroked glyph on Lucide’s grid and weight', () => {
    const glyph = fromLucide(lucideX);

    expect(glyph.viewBox).toBe('0 0 24 24');
    expect(glyph.strokeWidth).toBe(2);
    expect(glyph.filled).toBeFalsy();
    expect(glyph.shapes).toEqual([
      { kind: 'path', d: 'M18 6 6 18' },
      { kind: 'path', d: 'm6 6 12 12' },
    ]);
  });

  it('converts every basic shape, with numbers as numbers', () => {
    const glyph = fromLucide([
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['ellipse', { cx: '12', cy: '5', rx: '9', ry: '3' }],
      ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
      ['line', { x1: '12', x2: '12', y1: '8', y2: '16' }],
      ['polyline', { points: '22 7 13.5 15.5 8.5 10.5 2 17' }],
      ['polygon', { points: '12 2 2 7 12 12' }],
    ]);

    expect(glyph.shapes).toEqual([
      { kind: 'circle', cx: 12, cy: 12, r: 10 },
      { kind: 'ellipse', cx: 12, cy: 5, rx: 9, ry: 3 },
      { kind: 'rect', x: 3, y: 3, width: 18, height: 18, rx: 2, ry: undefined },
      { kind: 'line', x1: 12, y1: 8, x2: 12, y2: 16 },
      { kind: 'polyline', points: '22 7 13.5 15.5 8.5 10.5 2 17' },
      { kind: 'polygon', points: '12 2 2 7 12 12' },
    ]);
  });

  it('keeps a per-element fill, as currentColor whatever colour it named', () => {
    const glyph = fromLucide([['circle', { cx: 12, cy: 12, r: 1, fill: 'red' }]]);

    expect(glyph.shapes[0]).toMatchObject({ fill: 'currentColor' });
  });

  it('ignores attributes a shape has no use for, such as a React key', () => {
    const glyph = fromLucide([['path', { d: 'M1', key: 'abc123' }]]);

    expect(glyph.shapes).toEqual([{ kind: 'path', d: 'M1' }]);
  });

  it('takes a different grid and weight, for another set of the same shape', () => {
    const glyph = fromLucide(lucideX, { viewBox: '0 0 20 20', strokeWidth: 1.5 });

    expect(glyph.viewBox).toBe('0 0 20 20');
    expect(glyph.strokeWidth).toBe(1.5);
  });

  /*
   * A glyph missing one of its strokes looks like a different icon, so an
   * element it cannot draw is an error, not something to skip quietly.
   */
  it('throws on an element it cannot draw, naming it', () => {
    expect(() => fromLucide([['g', {}]])).toThrow(/<g>/);
    expect(() => fromLucide([['circle', { cx: '12', cy: '12' }]])).toThrow(/`r`/);
  });
});

describe('toIconGlyph', () => {
  it('passes a glyph through unchanged', () => {
    const glyph: IconGlyph = { viewBox: '0 0 1 1', shapes: [] };

    expect(toIconGlyph(glyph)).toBe(glyph);
  });

  it('converts a Font Awesome definition and a Lucide node', () => {
    expect(toIconGlyph(regular).fontAwesome).toBe(regular);
    expect(toIconGlyph(lucideX).strokeWidth).toBe(2);
  });

  it('throws on anything else, naming the entry', () => {
    expect(() => toIconGlyph({} as IconGlyph, 'mystery')).toThrow(/"mystery"/);
    expect(() => toIconGlyph(null as unknown as IconGlyph, 'nothing')).toThrow(/"nothing"/);
  });
});

describe('glyphAttributes', () => {
  /*
   * SVG's initial `fill` is black, so a stroked glyph that does not set
   * `fill: none` draws a filled blob rather than a line. A converted Lucide
   * icon is the case that depends on it now, not just the built-in chevrons.
   */
  it('turns the fill off on a stroked glyph and rounds its ends', () => {
    expect(glyphAttributes(fromLucide(lucideX))).toEqual({
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    });
  });

  it('fills a filled glyph and leaves the stroke alone', () => {
    const attributes = glyphAttributes(fromFontAwesome(regular));

    expect(attributes.fill).toBe('currentColor');
    expect(attributes.stroke).toBeUndefined();
    expect(attributes.strokeLinecap).toBeUndefined();
  });

  it('honours a set’s own line caps and joins', () => {
    const glyph: IconGlyph = {
      viewBox: '0 0 24 24',
      strokeWidth: 1.5,
      strokeLinecap: 'square',
      strokeLinejoin: 'miter',
      shapes: [],
    };

    expect(glyphAttributes(glyph)).toMatchObject({
      strokeLinecap: 'square',
      strokeLinejoin: 'miter',
    });
  });
});

describe('glyphElements', () => {
  it('spells each shape’s attributes as SVG does, and omits what is absent', () => {
    const glyph: IconGlyph = {
      viewBox: '0 0 24 24',
      filled: true,
      shapes: [
        { kind: 'path', d: 'M1', fillRule: 'evenodd', opacity: 0.4 },
        { kind: 'rect', width: 4, height: 4, rx: 1 },
        { kind: 'circle', cx: 1, cy: 2, r: 3, fill: 'none', stroke: 'currentColor' },
      ],
    };

    expect(glyphElements(glyph)).toEqual([
      { tag: 'path', attributes: { d: 'M1', opacity: 0.4, 'fill-rule': 'evenodd' } },
      { tag: 'rect', attributes: { width: 4, height: 4, rx: 1 } },
      {
        tag: 'circle',
        attributes: { cx: 1, cy: 2, r: 3, fill: 'none', stroke: 'currentColor' },
      },
    ]);
  });
});
