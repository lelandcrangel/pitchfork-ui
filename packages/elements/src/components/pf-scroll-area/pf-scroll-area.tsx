import { Component, Element, h, Host, Prop } from '@stencil/core';

export type PfScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

/**
 * A scrollable region with a styled, non-overlaying scrollbar.
 *
 * @slot - the content to scroll.
 */
@Component({
  tag: 'pf-scroll-area',
  styleUrl: 'pf-scroll-area.css',
  shadow: true,
})
export class PfScrollArea {
  @Element() el!: HTMLElement;

  /** Which axis scrolls. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) orientation: PfScrollAreaOrientation = 'vertical';

  /**
   * Make the region keyboard-focusable so it can be scrolled with the arrow
   * keys (WCAG 2.1.1). Set false when a focusable child already provides
   * keyboard access.
   */
  @Prop() focusable = true;

  /**
   * The host scrolls, so the host is what has to be focusable — there is no
   * inner element to put the tabindex on, which is why this is set here rather
   * than rendered.
   *
   * A consumer's own `tabindex` wins: read before the first render and never
   * overwritten, so `tabindex="-1"` is respected instead of being silently
   * reset to 0.
   */
  componentWillLoad() {
    if (this.focusable && !this.el.hasAttribute('tabindex')) {
      this.el.setAttribute('tabindex', '0');
    }
  }

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
