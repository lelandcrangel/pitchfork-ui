import { Component, h, Host, Prop } from '@stencil/core';

/**
 * Hides content visually while keeping it available to screen readers and
 * other assistive technology. Use for labels, instructions and status text
 * that are implied visually but need to be announced.
 *
 * The React component takes an `as` prop to choose its tag; a custom element's
 * tag is fixed, so wrap this instead of configuring it — `<h2><pf-visually-
 * hidden>Results</pf-visually-hidden></h2>` is still a heading named
 * "Results".
 *
 * @slot - the content to hide visually.
 */
@Component({
  tag: 'pf-visually-hidden',
  styleUrl: 'pf-visually-hidden.css',
  shadow: true,
})
export class PfVisuallyHidden {
  /**
   * Reveal the content when it, or a descendant, receives keyboard focus — the
   * classic "skip link" pattern. Reflected so the stylesheet can select on it.
   */
  @Prop({ reflect: true }) focusable = false;

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
