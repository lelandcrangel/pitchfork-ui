import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A shimmering placeholder for content that has not arrived.
 *
 * @part label - the visually hidden text the live region announces.
 */
@Component({
  tag: 'pf-loading-skeleton',
  styleUrl: 'pf-loading-skeleton.css',
  shadow: true,
})
export class PfLoadingSkeleton {
  /** Width, as a CSS length. A bare number is read as pixels. */
  @Prop() width: number | string = '100%';

  /** Height, as a CSS length. A bare number is read as pixels. */
  @Prop() height: number | string = 16;

  /** Use a pill radius instead of the default. Reflected for the stylesheet. */
  @Prop({ reflect: true }) rounded = false;

  /** Accessible name, announced by the live region. */
  @Prop() label = 'Loading content';

  /**
   * The React component branches on `typeof width === 'number'`. An attribute
   * is always a string, so `width="120"` would arrive as `"120"` and be used
   * as an invalid bare length. Treating a numeric string as pixels keeps
   * `width="120"` and `width={120}` meaning the same thing, while `width="50%"`
   * and `width="4rem"` pass through untouched.
   */
  private static toLength(value: number | string) {
    if (typeof value === 'number') return `${value}px`;
    return /^-?\d+(\.\d+)?$/.test(value.trim()) ? `${value.trim()}px` : value;
  }

  render() {
    return (
      <Host
        role="status"
        aria-label={this.label}
        style={{
          '--pf-skeleton-width': PfLoadingSkeleton.toLength(this.width),
          '--pf-skeleton-height': PfLoadingSkeleton.toLength(this.height),
        }}
      >
        <span class="sr-only" part="label">
          {this.label}
        </span>
      </Host>
    );
  }
}
