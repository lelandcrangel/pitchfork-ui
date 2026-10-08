import { getIconPaths, normalizeIconName, resolveIconGlyph } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';
import { registerBundledIcons } from './bundled-icons';
import { renderCustomIcon } from './custom-icons';

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
      `Register it with registerIconGlyphs({ '${name}': <the icon> }) from @pitchfork-ui/core.`,
  );
};

/**
 * One glyph from the icon registry.
 *
 * The registry is core's, not this element's, and that is deliberate: a
 * consumer calling `registerIcons()` has to get the icon in the React
 * components *and* here, and a registry per layer would silently give them
 * one or the other. A name the registry does not hold renders nothing and
 * warns once.
 *
 * @part svg - the rendered glyph.
 */
@Component({
  tag: 'pf-icon',
  styleUrl: 'pf-icon.css',
  shadow: true,
})
export class PfIcon {
  /** A registered Font Awesome name, one of its aliases, or a custom glyph. */
  @Prop() name!: string;

  /**
   * Accessible name. Without one the icon is decorative and hidden from
   * assistive technology, which is the right default beside a text label.
   */
  @Prop() label?: string;

  render() {
    const custom = renderCustomIcon(this.name) ?? renderCustomIcon(normalizeIconName(this.name));
    const glyph = custom ? undefined : resolveIconGlyph(this.name);

    if (!custom && !glyph) {
      warnUnknown(this.name);
      return null;
    }

    return (
      <Host
        role={this.label ? 'img' : null}
        aria-label={this.label}
        aria-hidden={this.label ? null : 'true'}
      >
        {custom ?? this.renderGlyph(glyph!)}
      </Host>
    );
  }

  private renderGlyph(glyph: NonNullable<ReturnType<typeof resolveIconGlyph>>) {
    const { viewBox, paths } = getIconPaths(glyph);

    return (
      <svg
        part="svg"
        width="1em"
        height="1em"
        viewBox={viewBox}
        fill="currentColor"
        focusable="false"
        aria-hidden="true"
      >
        {paths.map((d) => (
          <path d={d} />
        ))}
      </svg>
    );
  }
}
