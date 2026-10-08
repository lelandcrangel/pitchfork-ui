import { Component, h, Host, Prop } from '@stencil/core';

export type PfLoadingDotsSize = 'sm' | 'md' | 'lg';

/**
 * Three pulsing dots, for an indeterminate wait in a tight space.
 *
 * @part dot - each of the three dots.
 * @part label - the visually hidden text the live region announces.
 */
@Component({
  tag: 'pf-loading-dots',
  styleUrl: 'pf-loading-dots.css',
  shadow: true,
})
export class PfLoadingDots {
  /** Dot size. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) size: PfLoadingDotsSize = 'md';

  /** Accessible name, announced by the live region. */
  @Prop() label = 'Loading';

  render() {
    return (
      <Host role="status" aria-label={this.label}>
        <span class="dot" part="dot" aria-hidden="true" />
        <span class="dot" part="dot" aria-hidden="true" />
        <span class="dot" part="dot" aria-hidden="true" />
        <span class="sr-only" part="label">
          {this.label}
        </span>
      </Host>
    );
  }
}
