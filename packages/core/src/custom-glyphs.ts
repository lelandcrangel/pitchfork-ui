/**
 * The glyphs the Font Awesome regular set does not carry, as data.
 *
 * Thirteen of them, and until now there were two copies: one as React JSX in
 * `Icon.tsx`, one as Stencil JSX in `pf-icon/custom-icons.tsx`. They agreed,
 * which is what two copies do on the day they are written — and neither
 * layer's tests could have seen them diverge, because each one only ever
 * rendered its own.
 *
 * So the geometry lives here and each layer renders it: React maps a shape to
 * JSX with camelCase presentation attributes, Stencil to `h()` with the
 * hyphenated spelling. That difference is the whole reason this is data rather
 * than markup — core imports nothing and has no vdom of its own, the same
 * reason `getIconPaths` returns a viewBox and path strings instead of an
 * `<svg>`.
 *
 * Every glyph is drawn on a 24x24 grid and stroked in `currentColor`, except
 * `ellipsis`, which is three filled dots. A stroked glyph needs no `fill`
 * (SVG's initial `fill` is black, so `none` is not optional) and a filled one
 * needs no stroke, which is what `filled` selects.
 */

/** One drawing primitive. The three the glyph set actually uses. */
export type CustomGlyphShape =
  | { readonly kind: 'polyline'; readonly points: string }
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number };

export interface CustomGlyph {
  readonly viewBox: string;
  /**
   * Stroke width, in viewBox units. Absent on a filled glyph.
   *
   * The chevrons are heavier than everything else (3 against 2) because they
   * are drawn small, next to text, where a 2-unit stroke reads as grey rather
   * than as a mark.
   */
  readonly strokeWidth?: number;
  /** Fill the shapes in `currentColor` and do not stroke them. */
  readonly filled?: boolean;
  readonly shapes: readonly CustomGlyphShape[];
}

const polyline = (points: string): CustomGlyphShape => ({ kind: 'polyline', points });
const path = (d: string): CustomGlyphShape => ({ kind: 'path', d });
const circle = (cx: number, cy: number, r: number): CustomGlyphShape => ({
  kind: 'circle',
  cx,
  cy,
  r,
});

const VIEW_BOX = '0 0 24 24';

export const CUSTOM_GLYPHS = {
  'chevron-down': { viewBox: VIEW_BOX, strokeWidth: 3, shapes: [polyline('5 9 12 18 19 9')] },
  'chevron-up': { viewBox: VIEW_BOX, strokeWidth: 3, shapes: [polyline('5 15 12 6 19 15')] },
  'chevron-left': { viewBox: VIEW_BOX, strokeWidth: 3, shapes: [polyline('15 5 6 12 15 19')] },
  'chevron-right': { viewBox: VIEW_BOX, strokeWidth: 3, shapes: [polyline('9 5 18 12 9 19')] },
  'circle-info': {
    viewBox: VIEW_BOX,
    strokeWidth: 2,
    shapes: [circle(12, 12, 10), path('M12 16v-4'), path('M12 8h.01')],
  },
  'triangle-exclamation': {
    viewBox: VIEW_BOX,
    strokeWidth: 2,
    shapes: [
      path('m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z'),
      path('M12 9v4'),
      path('M12 17h.01'),
    ],
  },
  // The mirror of file-arrow-up, for an export or download action. Neither is
  // in the free-regular set.
  'file-arrow-down': {
    viewBox: VIEW_BOX,
    strokeWidth: 2,
    shapes: [
      path('M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'),
      path('M14 2v4a2 2 0 0 0 2 2h4'),
      path('M12 12v6'),
      path('m9 15 3 3 3-3'),
    ],
  },
  'file-arrow-up': {
    viewBox: VIEW_BOX,
    strokeWidth: 2,
    shapes: [
      path('M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'),
      path('M14 2v4a2 2 0 0 0 2 2h4'),
      path('M12 12v6'),
      path('m15 15-3-3-3 3'),
    ],
  },
  // "More options". The free-regular set has no horizontal ellipsis.
  ellipsis: {
    viewBox: VIEW_BOX,
    filled: true,
    shapes: [circle(5, 12, 2), circle(12, 12, 2), circle(19, 12, 2)],
  },
  plus: {
    viewBox: VIEW_BOX,
    strokeWidth: 2.5,
    shapes: [path('M12 5v14'), path('M5 12h14')],
  },
  clock: {
    viewBox: VIEW_BOX,
    strokeWidth: 2,
    shapes: [circle(12, 12, 9), path('M12 7v5l3 2')],
  },
  'magnifying-glass': {
    viewBox: VIEW_BOX,
    strokeWidth: 2,
    shapes: [circle(11, 11, 8), path('m21 21-4.35-4.35')],
  },
  minus: { viewBox: VIEW_BOX, strokeWidth: 2.5, shapes: [path('M5 12h14')] },
  // `satisfies` rather than an annotation, so the keys stay literal: it is
  // what gives `RegisteredIconName` in the React layer, and an editor its
  // completions.
} satisfies Record<string, CustomGlyph>;

/** The names of the glyphs this library draws itself. */
export type CustomGlyphName = keyof typeof CUSTOM_GLYPHS;

/** The custom glyph names, sorted. */
export const getCustomGlyphNames = () => Object.keys(CUSTOM_GLYPHS).sort();

export const resolveCustomGlyph = (name: string): CustomGlyph | undefined =>
  (CUSTOM_GLYPHS as Record<string, CustomGlyph>)[name];

/**
 * The `<svg>` presentation attributes a glyph needs, as values rather than
 * attribute names: the two layers spell the names differently
 * (`strokeWidth` against `stroke-width`), so naming them here would only move
 * the duplication.
 */
export function customGlyphAttributes(glyph: CustomGlyph) {
  return {
    viewBox: glyph.viewBox,
    fill: glyph.filled ? 'currentColor' : 'none',
    stroke: glyph.filled ? undefined : 'currentColor',
    strokeWidth: glyph.filled ? undefined : glyph.strokeWidth,
    strokeLinecap: glyph.filled ? undefined : ('round' as const),
    strokeLinejoin: glyph.filled ? undefined : ('round' as const),
  };
}

/**
 * The names of the Font Awesome regular icons both layers bundle.
 *
 * The glyphs themselves cannot live here — core imports nothing, and each
 * layer has to import them individually anyway, which is what keeps a
 * consumer's bundle to the icons in use. What can live here is the list, so a
 * test in each layer asserts its own map's keys against it. Adding a name to
 * one layer and forgetting the other then fails, instead of leaving an icon
 * that renders in React and nothing in `<pf-icon>`.
 */
export const BUNDLED_FA_ICON_NAMES = [
  'bell',
  'calendar',
  'chart-bar',
  'circle-check',
  'circle-question',
  'circle-xmark',
  'copy',
  'credit-card',
  'file',
  'folder-open',
  'square-caret-left',
  'square-caret-right',
  'square-check',
  'star',
  'user',
] as const;
