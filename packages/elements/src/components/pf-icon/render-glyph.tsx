import { type IconGlyph, glyphAttributes, glyphElements } from '@pitchfork-ui/core';
import { h, type VNode } from '@stencil/core';

/*
 * Every glyph, from whichever set, drawn from core's one glyph shape.
 *
 * This used to draw only the thirteen built-in glyphs, while the component
 * drew Font Awesome's tuple itself with every path filled -- two renderers,
 * one of which could not draw a stroked icon or a duotone one. Core converts
 * Font Awesome and Lucide on the way into the registry, so there is one
 * shape here and one function drawing it.
 *
 * Core decides which attributes each shape has (`glyphElements`) and spells
 * them as SVG does, which is the spelling Stencil sets; the React `Icon`
 * camel-cases the one hyphenated name. That attribute-name difference is the
 * whole reason core holds *data*.
 *
 * A separate module because Stencil allows a component file only one export.
 */
export const renderGlyph = (glyph: IconGlyph): VNode => {
  const { viewBox, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin } =
    glyphAttributes(glyph);

  return (
    <svg
      // The Font Awesome branch always exposed this part and the built-in
      // glyphs did not, so `pf-icon::part(svg)` reached two thirds of the
      // icons and silently missed every chevron. One renderer now, one part.
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
      {glyphElements(glyph).map(({ tag, attributes }) => h(tag, { ...attributes }))}
    </svg>
  );
};
