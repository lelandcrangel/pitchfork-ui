import { Component, h, Host } from '@stencil/core';

/**
 * The header section of a `pf-modal`.
 *
 * A separate element rather than a named slot, for the reason `pf-card` gives:
 * a named slot would need emptiness detection or leave a padded, bordered
 * strip when nothing was slotted into it.
 *
 * @slot - the section's content.
 */
@Component({
  tag: 'pf-modal-header',
  styleUrl: 'pf-modal-header.css',
  shadow: true,
})
export class PfModalHeader {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
