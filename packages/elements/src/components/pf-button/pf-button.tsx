import { Component, h, Host, Prop } from '@stencil/core';

export type PfButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type PfButtonSize = 'sm' | 'md' | 'lg';
export type PfButtonType = 'button' | 'submit' | 'reset';

/**
 * @slot - the button's label.
 * @part button - the native button element.
 * @part spinner - the loading spinner.
 */
@Component({
  tag: 'pf-button',
  styleUrl: 'pf-button.css',
  // delegatesFocus so that focusing <pf-button> reaches the real button, and
  // :focus-visible lands on the element that is actually styled for it.
  shadow: { delegatesFocus: true },
})
export class PfButton {
  /** Visual style. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) variant: PfButtonVariant = 'primary';

  /** Control size. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) size: PfButtonSize = 'md';

  /** Stretch to the width of the container. */
  @Prop({ reflect: true }) fullWidth = false;

  /** Show a spinner and block interaction. */
  @Prop({ reflect: true }) loading = false;

  /** Disable the button. */
  @Prop({ reflect: true }) disabled = false;

  /**
   * Mirrors the native attribute. `submit` and `reset` do not yet act on a form
   * outside this element's shadow root -- that needs ElementInternals, which
   * arrives with the form controls in Wave 3.
   */
  @Prop() type: PfButtonType = 'button';

  /** Accessible name, for when the slot holds only an icon. */
  @Prop() label?: string;

  private renderSpinner() {
    return (
      <svg
        class="spinner"
        part="spinner"
        viewBox="0 0 24 24"
        fill="none"
        width="1em"
        height="1em"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="32"
          stroke-dashoffset="8"
        />
      </svg>
    );
  }

  render() {
    const isDisabled = this.disabled || this.loading;

    return (
      <Host>
        <button
          part="button"
          type={this.type}
          disabled={isDisabled}
          aria-busy={this.loading ? 'true' : null}
          aria-label={this.label}
        >
          {this.loading && this.renderSpinner()}
          <slot />
        </button>
      </Host>
    );
  }
}
