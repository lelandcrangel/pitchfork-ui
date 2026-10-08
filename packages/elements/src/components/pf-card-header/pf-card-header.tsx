import { Component, h, Host } from '@stencil/core';

/**
 * The top section of a `pf-card`, separated from what follows by a rule.
 *
 * @slot - the header's content.
 */
@Component({
  tag: 'pf-card-header',
  styleUrl: 'pf-card-header.css',
  shadow: true,
})
export class PfCardHeader {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
