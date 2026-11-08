/**
 * One glyph shape for every icon set, and the adapters into it.
 *
 * The registry used to hold Font Awesome's tuple —
 * `[width, height, aliases, unicode, pathData]` — and draw every path filled
 * in `currentColor`. That shape cannot describe a stroked set at all (Lucide,
 * Heroicons outline, Tabler and most company sets are lines, not fills: drawn
 * filled, a chevron becomes a wedge), and it drew a Font Awesome duotone
 * icon's secondary layer at full opacity, so the two layers merged into one
 * solid blob.
 *
 * `IconGlyph` is the general shape: a viewBox, whether the glyph is stroked or
 * filled, and a list of SVG primitives. It is what the thirteen built-in
 * glyphs were already written in, and both rendering layers draw it.
 *
 * Core imports nothing, so the adapters are structural. `fromFontAwesome`
 * accepts anything shaped like Font Awesome's `IconDefinition`, in any style —
 * Pro's light, thin, sharp and duotone included — and `fromLucide` accepts
 * Lucide's `IconNode`. Neither package is a dependency of this one.
 *
 * Colour is deliberately not a field. Every paint is `currentColor` or
 * `none`, so a glyph's colour always comes from the element it sits in, which
 * is what keeps icons on the token chain.
 */

/** Per-shape paint overrides. Each defaults to the glyph's own. */
interface ShapePaint {
  /** Override the glyph's fill for this shape — a filled dot in a stroked icon. */
  readonly fill?: 'currentColor' | 'none';
  /** Override the glyph's stroke for this shape. */
  readonly stroke?: 'currentColor' | 'none';
  /**
   * 0–1. A duotone icon's secondary layer is the case this exists for: Font
   * Awesome draws it at 0.4, so `fromFontAwesome` does too.
   */
  readonly opacity?: number;
  /** Heroicons' solid set cuts holes with `evenodd`. */
  readonly fillRule?: 'nonzero' | 'evenodd';
}

/** One drawing primitive. The seven SVG basic shapes an icon set uses. */
export type IconGlyphShape = ShapePaint &
  (
    | { readonly kind: 'path'; readonly d: string }
    | { readonly kind: 'polyline'; readonly points: string }
    | { readonly kind: 'polygon'; readonly points: string }
    | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
    | {
        readonly kind: 'ellipse';
        readonly cx: number;
        readonly cy: number;
        readonly rx: number;
        readonly ry: number;
      }
    | {
        readonly kind: 'rect';
        readonly x?: number;
        readonly y?: number;
        readonly width: number;
        readonly height: number;
        readonly rx?: number;
        readonly ry?: number;
      }
    | {
        readonly kind: 'line';
        readonly x1: number;
        readonly y1: number;
        readonly x2: number;
        readonly y2: number;
      }
  );

export interface IconGlyph {
  readonly viewBox: string;
  /**
   * Stroke width, in viewBox units. Absent on a filled glyph, and on a stroked
   * one it falls back to SVG's 1, which reads as grey beside a set drawn at 2.
   */
  readonly strokeWidth?: number;
  /** Fill the shapes in `currentColor` and do not stroke them. */
  readonly filled?: boolean;
  /** Defaults to `round`, which is what Lucide, Heroicons and Tabler all use. */
  readonly strokeLinecap?: 'round' | 'butt' | 'square';
  /** Defaults to `round`. */
  readonly strokeLinejoin?: 'round' | 'miter' | 'bevel';
  readonly shapes: readonly IconGlyphShape[];
  /**
   * Other names this glyph answers to. Font Awesome keeps an icon's former
   * names (`bar-chart` for `chart-bar`), and `fromFontAwesome` carries them
   * here so they keep resolving.
   */
  readonly aliases?: readonly string[];
  /**
   * The Font Awesome definition this glyph was converted from, when it was.
   * The React `Icon` hands it to `FontAwesomeIcon`, because its props are
   * Font Awesome's (`spin`, `size`, `flip`…) and only that renderer honours
   * them. `<pf-icon>` ignores it and draws the shapes.
   */
  readonly fontAwesome?: FontAwesomeIconDefinition;
}

/**
 * Structurally compatible with Font Awesome's `IconDefinition`, in every
 * style. Core does not import Font Awesome; a definition from any of its
 * packages, free or Pro, satisfies this as it is.
 */
export interface FontAwesomeIconDefinition {
  prefix?: string;
  iconName?: string;
  /** `[width, height, aliases, unicode, pathData]` — Font Awesome's tuple. */
  icon: [number, number, string[], string, string | string[]];
}

/** Lucide's `IconNode`: a list of `[tag, attributes]` pairs on a 24-unit grid. */
export type LucideIconNode = readonly (readonly [
  tag: string,
  attributes: Readonly<Record<string, string | number | undefined>>,
])[];

/** Anything the registry accepts: a glyph, or a definition it can convert. */
export type IconGlyphInput = IconGlyph | FontAwesomeIconDefinition | LucideIconNode;

/*
 * Font Awesome's own renderer, read from `@fortawesome/fontawesome-svg-core`
 * 7.3.1 rather than assumed: a duotone `pathData` is `[secondary, primary]`,
 * drawn in that order, with the secondary at `--fa-secondary-opacity`, which
 * defaults to 0.4. Either layer may be an empty string.
 */
const FA_SECONDARY_OPACITY = 0.4;

/** A Font Awesome `IconDefinition`, in any style, as a glyph. */
export function fromFontAwesome(definition: FontAwesomeIconDefinition): IconGlyph {
  const [width, height, aliases, , pathData] = definition.icon;

  const shapes: IconGlyphShape[] = [];
  if (Array.isArray(pathData)) {
    const [secondary, primary] = pathData;
    if (secondary) shapes.push({ kind: 'path', d: secondary, opacity: FA_SECONDARY_OPACITY });
    if (primary) shapes.push({ kind: 'path', d: primary });
  } else if (pathData) {
    shapes.push({ kind: 'path', d: pathData });
  }

  return {
    viewBox: `0 0 ${width} ${height}`,
    filled: true,
    shapes,
    // `icon[2]` mixes the former names with the unicode codepoints the icon
    // also renders under; only the strings are names.
    aliases: Array.isArray(aliases) ? aliases.filter((a) => typeof a === 'string') : [],
    fontAwesome: definition,
  };
}

export interface FromLucideOptions {
  /** Lucide draws on `0 0 24 24`. */
  viewBox?: string;
  /** Lucide's default is 2. */
  strokeWidth?: number;
}

const number = (value: string | number | undefined, tag: string, attribute: string) => {
  const parsed = Number(value);
  if (value === undefined || value === '' || !Number.isFinite(parsed)) {
    throw new TypeError(`fromLucide: <${tag}> has no usable \`${attribute}\` (${String(value)}).`);
  }
  return parsed;
};

const optionalNumber = (value: string | number | undefined, tag: string, attribute: string) =>
  value === undefined ? undefined : number(value, tag, attribute);

const paint = (value: string | number): 'none' | 'currentColor' =>
  value === 'none' ? 'none' : 'currentColor';

/**
 * A Lucide `IconNode` as a glyph. Any set that ships the same `[tag, attrs][]`
 * shape converts the same way; `options` covers a different grid or weight.
 *
 * An element it cannot draw throws rather than being skipped: a glyph missing
 * one of its strokes looks like a different icon, and nothing else would say
 * so.
 */
export function fromLucide(node: LucideIconNode, options: FromLucideOptions = {}): IconGlyph {
  if (!Array.isArray(node)) {
    throw new TypeError('fromLucide: expected an IconNode, a list of [tag, attributes] pairs.');
  }

  const shapes = node.map(([tag, attrs]): IconGlyphShape => {
    const overrides: ShapePaint = {
      ...(attrs.fill !== undefined && { fill: paint(attrs.fill) }),
      ...(attrs.stroke !== undefined && { stroke: paint(attrs.stroke) }),
      ...(attrs.opacity !== undefined && { opacity: number(attrs.opacity, tag, 'opacity') }),
      ...(attrs['fill-rule'] === 'evenodd' && { fillRule: 'evenodd' as const }),
    };
    const at = (name: string) => number(attrs[name], tag, name);
    const maybe = (name: string) => optionalNumber(attrs[name], tag, name);

    switch (tag) {
      case 'path':
        return { kind: 'path', d: String(attrs.d ?? ''), ...overrides };
      case 'polyline':
        return { kind: 'polyline', points: String(attrs.points ?? ''), ...overrides };
      case 'polygon':
        return { kind: 'polygon', points: String(attrs.points ?? ''), ...overrides };
      case 'circle':
        return { kind: 'circle', cx: at('cx'), cy: at('cy'), r: at('r'), ...overrides };
      case 'ellipse':
        return {
          kind: 'ellipse',
          cx: at('cx'),
          cy: at('cy'),
          rx: at('rx'),
          ry: at('ry'),
          ...overrides,
        };
      case 'rect':
        return {
          kind: 'rect',
          x: maybe('x'),
          y: maybe('y'),
          width: at('width'),
          height: at('height'),
          rx: maybe('rx'),
          ry: maybe('ry'),
          ...overrides,
        };
      case 'line':
        return {
          kind: 'line',
          x1: at('x1'),
          y1: at('y1'),
          x2: at('x2'),
          y2: at('y2'),
          ...overrides,
        };
      default:
        throw new TypeError(
          `fromLucide: <${tag}> is not one of the shapes a glyph can hold ` +
            '(path, polyline, polygon, circle, ellipse, rect, line).',
        );
    }
  });

  return {
    viewBox: options.viewBox ?? '0 0 24 24',
    strokeWidth: options.strokeWidth ?? 2,
    shapes,
  };
}

const isGlyph = (value: object): value is IconGlyph =>
  Array.isArray((value as IconGlyph).shapes) && typeof (value as IconGlyph).viewBox === 'string';

const isFontAwesome = (value: object): value is FontAwesomeIconDefinition =>
  Array.isArray((value as FontAwesomeIconDefinition).icon);

/**
 * Any accepted input as a glyph. The three shapes cannot be mistaken for one
 * another — an `IconNode` is an array, a Font Awesome definition has an
 * `icon` tuple, a glyph has `shapes` — and anything else throws by name,
 * because a registration that silently draws nothing is the failure this
 * registry exists to prevent.
 */
export function toIconGlyph(input: IconGlyphInput, name = 'icon'): IconGlyph {
  if (Array.isArray(input)) return fromLucide(input as LucideIconNode);
  if (input && typeof input === 'object') {
    if (isGlyph(input)) return input;
    if (isFontAwesome(input)) return fromFontAwesome(input);
  }
  throw new TypeError(
    `[pitchfork-ui] "${name}" is not an icon: expected a glyph ({ viewBox, shapes }), ` +
      "a Font Awesome IconDefinition or a Lucide IconNode. Convert other sets' " +
      'icons to a glyph first.',
  );
}

/**
 * The `<svg>` presentation attributes a glyph needs, as values rather than
 * attribute names: the two layers spell the names differently
 * (`strokeWidth` against `stroke-width`), so naming them here would only move
 * the duplication.
 */
export function glyphAttributes(glyph: IconGlyph) {
  const filled = Boolean(glyph.filled);
  return {
    viewBox: glyph.viewBox,
    // SVG's initial fill is black, so a stroked glyph that does not turn it
    // off draws a filled blob rather than a line.
    fill: filled ? 'currentColor' : 'none',
    stroke: filled ? undefined : 'currentColor',
    strokeWidth: filled ? undefined : glyph.strokeWidth,
    strokeLinecap: filled ? undefined : (glyph.strokeLinecap ?? 'round'),
    strokeLinejoin: filled ? undefined : (glyph.strokeLinejoin ?? 'round'),
  };
}

/** One child of the `<svg>`, with its attributes under their SVG names. */
export interface GlyphElement {
  readonly tag: IconGlyphShape['kind'];
  readonly attributes: Readonly<Record<string, string | number>>;
}

/**
 * Each shape as a tag and its attributes, spelled as SVG spells them
 * (`fill-rule`). Stencil sets them as written; React camel-cases the one
 * hyphenated name. Which attributes each shape has is decided here, once,
 * where it used to be a `switch` in each layer.
 */
export function glyphElements(glyph: IconGlyph): GlyphElement[] {
  return glyph.shapes.map((shape) => {
    const { kind, fill, stroke, opacity, fillRule, ...geometry } = shape;
    const attributes: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(geometry)) {
      if (value !== undefined) attributes[key] = value as string | number;
    }
    if (fill !== undefined) attributes.fill = fill;
    if (stroke !== undefined) attributes.stroke = stroke;
    if (opacity !== undefined) attributes.opacity = opacity;
    if (fillRule !== undefined) attributes['fill-rule'] = fillRule;

    return { tag: kind, attributes };
  });
}
