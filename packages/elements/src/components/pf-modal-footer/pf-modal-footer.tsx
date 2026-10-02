import { Component, h, Host } from '@stencil/core';

/**
 * The footer section of a `pf-modal`.
 *
 * A separate element rather than a named slot, for the reason `pf-card` gives:
 * a named slot would need emptiness detection or leave a padded, bordered
 * strip when nothing was slotted into it.
 *
 * @slot - the section's content.
 */
@Component({
  tag: 'pf-modal-footer',
  styleUrl: 'pf-modal-footer.css',
  shadow: true,
})
export class PfModalFooter {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
