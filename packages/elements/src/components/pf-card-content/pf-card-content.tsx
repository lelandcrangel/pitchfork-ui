import { Component, h, Host } from '@stencil/core';

/**
 * The body section of a `pf-card`.
 *
 * @slot - the content.
 */
@Component({
  tag: 'pf-card-content',
  styleUrl: 'pf-card-content.css',
  shadow: true,
})
export class PfCardContent {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
