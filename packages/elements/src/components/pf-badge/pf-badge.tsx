import { Component, h, Host, Prop } from '@stencil/core';

export type PfBadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

/**
 * A short status or count, rendered inline with the text around it.
 *
 * The leaf the `::part()` and reflected-attribute conventions were established
 * on, back when the stakes were low.
 *
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
