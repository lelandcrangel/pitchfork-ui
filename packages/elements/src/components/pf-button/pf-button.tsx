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
 * `type="submit"` and `type="reset"` act on the form around it, as a native
 * button's do. ARIA a wrapper sets on the host -- `aria-expanded`,
 * `aria-haspopup`, `aria-pressed` -- is copied to the real button inside, which
 * is the one a screen reader lands on. `delegatesFocus` is why focusing the
 * host reaches that button, which is what lets `pf-toolbar` treat it as an
 * item.
 *
 * With `href` it is a link styled as a button — the right element for
 * "Go to settings", where the action is navigation.
 *
 * @slot - the button's label.
 * @part button - the native button, or the `<a>` when `href` is set.
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

  /**
   * Makes it a link that looks like a button: the inner element is an `<a>`,
   * so it navigates, opens in a new tab on a modified click and is announced
   * as a link. `type` is ignored. A disabled or loading link has no `href` at
   * all, since an anchor has no disabled state of its own.
   */
  @Prop({ reflect: true }) href?: string;

  /** Where the link opens, as on an `<a>`. Only with `href`. */
  @Prop() target?: string;

  /** The link's relationship to its target, as on an `<a>`. Only with `href`. */
  @Prop() rel?: string;

  /** Download the target instead of navigating, as on an `<a>`. Only with `href`. */
  @Prop() download?: string;

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
    const content = [this.loading && this.renderSpinner(), <slot />];

    if (this.href !== undefined) {
      return (
        <Host>
          {isDisabled ? (
            // An anchor has no disabled state, so a disabled one drops its
            // `href` -- which takes it out of the tab order and stops it
            // navigating -- and says what it is.
            <a
              class="control"
              part="button"
              role="link"
              aria-disabled="true"
              {...this.forwardedAria}
              aria-busy={this.loading ? 'true' : null}
              aria-label={this.label}
            >
              {content}
            </a>
          ) : (
            <a
              class="control"
              part="button"
              href={this.href}
              target={this.target}
              rel={this.rel}
              download={this.download}
              {...this.forwardedAria}
              aria-label={this.label}
            >
              {content}
            </a>
          )}
        </Host>
      );
    }

    return (
      <Host>
        <button
          class="control"
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
          {content}
        </button>
      </Host>
    );
  }
}
