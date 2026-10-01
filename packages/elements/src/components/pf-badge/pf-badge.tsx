import { Component, h, Host, Prop } from '@stencil/core';

export type PfBadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

/**
 * @slot - the badge's content.
 */
@Component({
  tag: 'pf-badge',
  styleUrl: 'pf-badge.css',
  shadow: true,
})
export class PfBadge {
  /** Colour treatment. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) variant: PfBadgeVariant = 'neutral';

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
