import { type CustomGlyph, customGlyphAttributes, resolveCustomGlyph } from '@pitchfork-ui/core';
import { h, type VNode } from '@stencil/core';

/*
 * The glyphs the Font Awesome regular set does not carry, rendered from the
 * shared data in @pitchfork-ui/core.
 *
 * The geometry used to be written out here as Stencil JSX and a second time as
 * React JSX in the React `Icon`. Two copies of a shape agree on the day they
 * are written, and no test in either layer could have seen them stop agreeing,
 * because each layer only ever rendered its own. So core holds the shapes and
 * this maps them to Stencil's hyphenated presentation attributes -- which is
 * the whole reason core holds *data*: it has no vdom of its own, and the
 * attribute names differ between the two layers.
 *
 * A separate module because Stencil allows a component file only one export.
 */

/** The glyph for a name, as a VNode, or undefined if it is not a custom one. */
export const renderCustomIcon = (name: string): VNode | undefined => {
  const glyph = resolveCustomGlyph(name);
  return glyph ? renderGlyph(glyph) : undefined;
};

const renderGlyph = (glyph: CustomGlyph): VNode => {
  const { viewBox, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin } =
    customGlyphAttributes(glyph);

  return (
    <svg
      // The Font Awesome branch has always exposed this part; the custom
      // glyphs did not, so `pf-icon::part(svg)` reached two thirds of the
      // icons and silently missed every chevron.
      part="svg"
      width="1em"
      height="1em"
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      stroke-width={strokeWidth}
      stroke-linecap={strokeLinecap}
      stroke-linejoin={strokeLinejoin}
      focusable="false"
      aria-hidden="true"
    >
      {glyph.shapes.map((shape) => {
        if (shape.kind === 'polyline') return <polyline points={shape.points} />;
        if (shape.kind === 'circle') return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />;
        return <path d={shape.d} />;
      })}
    </svg>
  );
};
