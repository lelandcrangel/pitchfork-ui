import { AttachInternals, Component, Element, h, Host, Prop, State } from '@stencil/core';
import {
  type ForwardedAria,
  observeForwardedAria,
  readForwardedAria,
  sameForwardedAria,
} from '../../forward-aria';

export type PfButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type PfButtonSize = 'sm' | 'md' | 'lg';
export type PfButtonType = 'button' | 'submit' | 'reset';

/**
 * A button, with the variants, sizes and loading state the React `Button` has.
 *
 * The first element in this package, and the one the whole pipeline was proved
 * on: the PostCSS chain, the generated React bindings and the generated Angular
 * component all exist because this built end to end before anything else was
 * attempted. `delegatesFocus` is why focusing the host reaches the real button
 * inside, which is what lets `pf-toolbar` treat it as an item.
 *
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
  // Form-associated so `type="submit"` and `type="reset"` can reach the form
  // around the host: the native button sits in the shadow root, where it has no
  // form owner at all.
  formAssociated: true,
})
export class PfButton {
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /** Set by the platform, including for an enclosing `<fieldset disabled>`. */
  @State() formDisabled = false;

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
   * Mirrors the native attribute. `submit` submits the form the host is in
   * (running its validation, as `requestSubmit()` does) and `reset` resets it.
   * The submitter is not reported in the submission: a custom element cannot
   * be a form's submitter, so a `name`/`value` pair on it would go nowhere.
   */
  @Prop() type: PfButtonType = 'button';

  /** Accessible name, for when the slot holds only an icon. */
  @Prop() label?: string;

  /** ARIA state a wrapper set on the host, rendered onto the inner button. */
  @State() forwardedAria: ForwardedAria = {};

  private stopForwarding?: () => void;

  connectedCallback() {
    this.syncForwardedAria();
    this.stopForwarding = observeForwardedAria(this.el, () => this.syncForwardedAria());
  }

  disconnectedCallback() {
    this.stopForwarding?.();
    this.stopForwarding = undefined;
  }

  private syncForwardedAria() {
    const next = readForwardedAria(this.el);
    if (!sameForwardedAria(next, this.forwardedAria)) this.forwardedAria = next;
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  private onClick = () => {
    const form = this.internals.form;
    if (!form || this.disabled || this.loading || this.formDisabled) return;
    if (this.type === 'submit') form.requestSubmit();
    else if (this.type === 'reset') form.reset();
  };

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
    const isDisabled = this.disabled || this.loading || this.formDisabled;

    return (
      <Host>
        <button
          part="button"
          // Always a plain button: the one inside has no form owner, and the
          // host's own click handler does what `type` asks.
          type="button"
          disabled={isDisabled}
          onClick={this.onClick}
          {...this.forwardedAria}
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
