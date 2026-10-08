import { Component, h, Host, Prop } from '@stencil/core';

/**
 * An indeterminate spinner.
 *
 * @part label - the visually hidden text the live region announces.
 */
@Component({
  tag: 'pf-loading-spinner',
  styleUrl: 'pf-loading-spinner.css',
  shadow: true,
})
export class PfLoadingSpinner {
  /** Diameter in pixels. */
  @Prop() size = 24;

  /** Accessible name, announced by the live region. */
  @Prop() label = 'Loading';

  render() {
    /*
     * `role` and `aria-label` go on the host so the element is the live region,
     * and the hidden text gives that region something to announce — an empty
     * live region named only by `aria-label` is not reliably read out. The
     * React component carries both for the same reason.
     */
    return (
      <Host role="status" aria-label={this.label} style={{ '--pf-spinner-size': `${this.size}px` }}>
        <span class="sr-only" part="label">
          {this.label}
        </span>
      </Host>
    );
  }
}
