import { Component, h, Host, Prop } from '@stencil/core';

export type PfLinkVariant = 'default' | 'subtle';

/**
 * A text link, in the library's colours and focus ring.
 *
 * For a link that has to look like a button — "Go to settings" as a call to
 * action — use `pf-button` with `href` instead. This is the one that sits in
 * running text.
 *
 * `external` is the one decision it makes for you. A link that opens a new tab
 * should say so before it is followed, so it gets `target="_blank"`, a
 * `rel` of `noopener noreferrer` unless you give one, the `external` icon
 * role, and "(opens in a new tab)" for a screen reader — which an icon alone
 * would not tell anyone.
 *
 * @slot - the link text.
 * @part link - the `<a>` element.
 * @part icon - the external-link icon, when `external` is set.
 */
@Component({
  tag: 'pf-link',
  styleUrl: 'pf-link.css',
  shadow: { delegatesFocus: true },
})
export class PfLink {
  /** Where the link goes. */
  @Prop({ reflect: true }) href?: string;

  /** Where it opens, as on an `<a>`. `external` sets `_blank`. */
  @Prop() target?: string;

  /** The link's relationship to its target, as on an `<a>`. */
  @Prop() rel?: string;

  /** Download the target instead of navigating, as on an `<a>`. */
  @Prop() download?: string;

  /**
   * `subtle` draws the link in the surrounding text colour, underlined, for
   * a page dense with links. Reflected for the stylesheet.
   */
  @Prop({ reflect: true }) variant: PfLinkVariant = 'default';

  /** Opens in a new tab, and says so. */
  @Prop({ reflect: true }) external = false;

  render() {
    return (
      <Host>
        <a
          part="link"
          class="link"
          href={this.href}
          target={this.external ? '_blank' : this.target}
          rel={this.rel ?? (this.external ? 'noopener noreferrer' : undefined)}
          download={this.download}
        >
          <slot />
          {this.external && [
            <pf-icon class="icon" part="icon" name="external" aria-hidden="true"></pf-icon>,
            <span class="sr-only"> (opens in a new tab)</span>,
          ]}
        </a>
      </Host>
    );
  }
}
