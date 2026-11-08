import { resolveIconGlyph } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';
import { registerBundledIcons } from './bundled-icons';
import { renderGlyph } from './render-glyph';

// Called rather than imported for its side effect: a side-effect-only
// import is something a bundler may drop, and did.
registerBundledIcons();

const warned = new Set<string>();

const warnUnknown = (name: string) => {
  if (warned.has(name)) return;
  warned.add(name);
  // Deliberately not behind a build-time DEV guard: the React library lost
  // this warning to exactly that, and unknown names failed in silence.
  console.warn(
    `[pitchfork-ui] <pf-icon name="${name}"> is not registered, so nothing was drawn. ` +
      `Register it with registerIconGlyphs({ '${name}': <the icon> }) from @pitchfork-ui/core, ` +
      'or use one of the roles getIconRoles() lists.',
  );
};

/**
 * One glyph from the icon registry.
 *
 * The registry is core's, not this element's, and that is deliberate: a
 * consumer calling `registerIconGlyphs()` has to get the icon in the React
 * components *and* here, and a registry per layer would silently give them
 * one or the other. A name the registry does not hold renders nothing and
 * warns once.
 *
 * `name` takes a role (`close`, `next`, `search`…), which is what the other
 * elements ask for, or a glyph name. What is registered wins over the
 * built-in glyphs, so swapping in Font Awesome Pro, Lucide or a company set
 * changes every icon the library draws — see Foundations → Icons.
 *
 * @part svg - the rendered glyph.
 */
@Component({
  tag: 'pf-icon',
  styleUrl: 'pf-icon.css',
  shadow: true,
})
export class PfIcon {
  /**
   * A role such as `close` or `next`, a registered name or one of its Font
   * Awesome aliases, or a built-in glyph.
   */
  @Prop() name!: string;

  /**
   * Accessible name. Without one the icon is decorative and hidden from
   * assistive technology, which is the right default beside a text label.
   */
  @Prop() label?: string;

  render() {
    const glyph = resolveIconGlyph(this.name);

    if (!glyph) {
      warnUnknown(this.name);
      return null;
    }

    return (
      <Host
        role={this.label ? 'img' : null}
        aria-label={this.label}
        aria-hidden={this.label ? null : 'true'}
      >
        {renderGlyph(glyph)}
      </Host>
    );
  }
}
