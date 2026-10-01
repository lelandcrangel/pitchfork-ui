import { Component, h, Host, Prop } from '@stencil/core';

export type PfBadgeGroupColor = 'gray' | 'brand' | 'error' | 'warning' | 'success';
export type PfBadgeGroupAppearance = 'pill' | 'modern';
export type PfBadgeGroupBadgePosition = 'leading' | 'trailing';

/**
 * A badge joined to a line of text, sharing one rounded outline — the
 * "2 new · See what's changed" pattern.
 *
 * @part badge - the coloured badge.
 * @part text - the message beside it.
 */
@Component({
  tag: 'pf-badge-group',
  styleUrl: 'pf-badge-group.css',
  shadow: true,
})
export class PfBadgeGroup {
  /** The badge's text. */
  @Prop() label = '';

  /** The message beside the badge. */
  @Prop() message = '';

  /** Colour treatment. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) color: PfBadgeGroupColor = 'gray';

  /** Surface treatment for the message. Reflected for the stylesheet. */
  @Prop({ reflect: true }) appearance: PfBadgeGroupAppearance = 'pill';

  /** Which side the badge sits on. Reflected for the stylesheet. */
  @Prop({ reflect: true }) badgePosition: PfBadgeGroupBadgePosition = 'leading';

  render() {
    const badge = (
      <span class="badge" part="badge">
        {this.label}
      </span>
    );
    const text = (
      <span class="text" part="text">
        {this.message}
      </span>
    );

    /*
     * Ordered in the DOM rather than reversed with `flex-direction`, so a
     * screen reader reads the badge and the message in the order they appear.
     */
    return <Host>{this.badgePosition === 'leading' ? [badge, text] : [text, badge]}</Host>;
  }
}
