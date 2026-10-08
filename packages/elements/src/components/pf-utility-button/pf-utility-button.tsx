import { Component, Element, h, Host, Prop } from '@stencil/core';

export type PfUtilityButtonVariant = 'neutral' | 'brand' | 'destructive';
export type PfUtilityButtonSize = 'sm' | 'md';

/**
 * A compact button for toolbars and table rows, where the affordance is often
 * an icon alone.
 *
 * @slot - the button's label. Omit it for an icon-only button, and give a
 * `label` so the button still has an accessible name.
 * @slot icon - a leading icon, usually `pf-icon`.
 * @part button - the native button element.
 */
@Component({
  tag: 'pf-utility-button',
  styleUrl: 'pf-utility-button.css',
  // delegatesFocus so focusing <pf-utility-button> reaches the real button and
  // :focus-visible lands on the element the stylesheet rings.
  shadow: { delegatesFocus: true },
})
export class PfUtilityButton {
  @Element() el!: HTMLElement;

  /** Colour treatment. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) variant: PfUtilityButtonVariant = 'neutral';

  /** Control size. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) size: PfUtilityButtonSize = 'md';

  /** Disable the button. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) disabled = false;

  /** Mirrors the native attribute. */
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Accessible name. Required for an icon-only button, and also used as the
   * native tooltip unless `tooltip` says otherwise.
   */
  @Prop() label?: string;

  /** Native tooltip text. Defaults to `label`. */
  @Prop() tooltip?: string;

  /**
   * An icon-only button with no name is invisible to a screen reader, and it is
   * the mistake this component invites.
   *
   * Once per element, in `componentDidLoad`. `pf-icon` dedupes its own warning
   * by icon name, but there is no equivalent key here, and a module-level flag
   * would make the warning depend on what else happened to render first. Fifty
   * nameless buttons are fifty real defects, and the React component is noisier
   * still -- it warns from the render body, so once per render.
   */
  componentDidLoad() {
    if (this.label || this.el.getAttribute('aria-label')) return;
    const hasText = Array.from(this.el.childNodes).some(
      (node) =>
        (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) ||
        (node.nodeType === Node.ELEMENT_NODE && (node as Element).getAttribute('slot') !== 'icon'),
    );
    if (hasText) return;
    console.warn(
      '[pf-utility-button] An icon-only button needs a `label` (or an `aria-label`) — this one has no accessible name.',
    );
  }

  render() {
    return (
      <Host>
        <button
          part="button"
          type={this.type}
          disabled={this.disabled}
          aria-label={this.label}
          title={this.tooltip ?? this.label}
        >
          {/*
            The slots sit directly in the flex container rather than inside
            wrapper spans. A `slot` is `display: contents` per the UA
            stylesheet, so an empty one contributes no flex item and the
            button's `gap` does not open beside it -- which a wrapper span
            would, being a zero-width item that still counts. There is no
            emptiness to detect.
          */}
          <slot name="icon" />
          <slot />
        </button>
      </Host>
    );
  }
}
