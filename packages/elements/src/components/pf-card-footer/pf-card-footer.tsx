import { Component, h, Host } from '@stencil/core';

/**
 * The bottom section of a `pf-card`, separated from what precedes it by a rule.
 * Lays its children out in a row, which is what makes it the natural home for
 * a card's actions.
 *
 * @slot - the footer's content, usually buttons.
 */
@Component({
  tag: 'pf-card-footer',
  styleUrl: 'pf-card-footer.css',
  shadow: true,
})
export class PfCardFooter {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
