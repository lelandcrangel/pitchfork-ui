import { composeDescribedBy } from '@pitchfork-ui/core';
import { applyControlValidity, typeMismatchMessage } from '../../form-validity';
import { controlAriaLabel } from '../../control-label';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  Watch,
  State,
} from '@stencil/core';

export type PfInputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

/**
 * A form-associated text input.
 *
 * `formAssociated` plus `ElementInternals` is what makes this participate in a
 * real `<form>`: the value reaches `FormData`, constraint validation works, and
 * Angular's generated value accessor has something to bind to. A plain
 * `<input>` inside a shadow root does none of that.
 *
 * Text, an icon or a unit can sit inside the box on either side of the text,
 * through the `prefix` and `suffix` slots. `clearable` adds a button that
 * empties the field, and `revealable` on a password field adds one that shows
 * and hides what was typed; both are real buttons inside the box, and both
 * hand focus back to the text.
 *
 * @slot prefix - an icon or text before the value, inside the box.
 * @slot suffix - an icon, unit or text after the value, inside the box.
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part control - the box: border, background, adornments and the input.
 * @part input - the native input.
 * @part clear - the clear button, when `clearable` is set.
 * @part reveal - the show-password button, when `revealable` is set.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-input',
  styleUrl: 'pf-input.css',
  formAssociated: true,
  shadow: { delegatesFocus: true },
})
export class PfInput {
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /**
   * Submitted under this name.
   *
   * Reflected, because a form-associated custom element takes its submission
   * name from the `name` *content attribute* -- not from this property. A
   * framework wrapper that sets properties rather than attributes (the
   * generated React bindings do) would otherwise leave the control nameless
   * and absent from the submission, with every other sign of working.
   */
  @Prop({ reflect: true }) name?: string;

  /** The control's value. */
  @Prop({ mutable: true }) value = '';

  @Prop({ reflect: true }) type: PfInputType = 'text';

  /** Visible label. Rendered in the same root as the input, so `for` works. */
  @Prop() label?: string;

  /** Hint text below the control. */
  @Prop() description?: string;

  /** Error message. Its presence is what marks the control invalid. */
  @Prop() error?: string;

  @Prop() placeholder?: string;

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  @Prop({ reflect: true }) readonly = false;

  /** Offer a button that empties the field while it holds a value. */
  @Prop() clearable = false;

  /** On a password field, offer a button that shows what was typed. */
  @Prop() revealable = false;

  /** Whether a password is being shown as text. */
  @State() revealed = false;

  /** Fires on every keystroke, like the native `input` event. */
  @Event() pfInput!: EventEmitter<{ value: string }>;

  /** Fires when the value is committed, like the native `change` event. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /**
   * The value the control had when it was created, which is what a form reset
   * restores. Captured here because `value` has been overwritten by then.
   */
  private initialValue = '';

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    this.syncFormState();
  }

  @Watch('value')
  @Watch('error')
  @Watch('required')
  @Watch('type')
  syncFormState() {
    // (A `readonly` host needs nothing here: the platform bars a read-only
    // form-associated element from constraint validation by itself.)
    this.internals.setFormValue(this.value ?? '');
    applyControlValidity(this.internals, Boolean(this.value), this.required, this.error);
    if (this.error || !this.value) return;

    // The inner input sits in the shadow root and its own constraints reach no
    // form, so ask the browser the question it would ask a native input of
    // this type. A detached probe answers for the value being set right now,
    // where the rendered input still holds the previous one until the next
    // render.
    const mismatch = typeMismatchMessage(this.type, this.value);
    if (mismatch) this.internals.setValidity({ typeMismatch: true }, mismatch);
  }

  /**
   * Whether the control currently satisfies its constraints.
   *
   * A form-associated custom element does not inherit `checkValidity` from
   * anywhere -- the spec puts it on ElementInternals, so the element has to
   * forward it or consumers cannot ask.
   */
  @Method()
  async checkValidity(): Promise<boolean> {
    return this.internals.checkValidity();
  }

  /** As `checkValidity`, but also shows the browser's validation message. */
  @Method()
  async reportValidity(): Promise<boolean> {
    return this.internals.reportValidity();
  }

  /** The message explaining why the control is invalid, or an empty string. */
  @Method()
  async getValidationMessage(): Promise<string> {
    return this.internals.validationMessage;
  }

  /**
   * A reset restores the value the control started with, not an empty string —
   * verified against a native `<input value="initial">`, which comes back to
   * "initial" rather than to "". Clearing it was a real defect: a
   * `<pf-input value="…">` in a form lost its value on any reset.
   */
  formResetCallback() {
    this.value = this.initialValue;
  }

  /**
   * Whether the platform says this control is disabled -- by its own
   * `disabled` or by an enclosing `<fieldset disabled>`. A native control
   * honours the fieldset; without this the host drops out of the submission
   * while the control inside stays fully usable, so input is silently lost.
   */
  @State() formDisabled = false;

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  private get controlDisabled() {
    return this.disabled || this.formDisabled;
  }

  private onInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
    this.pfInput.emit({ value: this.value });
  };

  private onChange = () => {
    this.pfChange.emit({ value: this.value });
  };

  private get inputEl() {
    return this.el.shadowRoot?.querySelector<HTMLInputElement>('input') ?? null;
  }

  /** Empties the field as typing would, so both events fire, and keeps focus in it. */
  private clear = () => {
    this.value = '';
    this.pfInput.emit({ value: '' });
    this.pfChange.emit({ value: '' });
    this.inputEl?.focus();
  };

  private toggleReveal = () => {
    this.revealed = !this.revealed;
    this.inputEl?.focus();
  };

  /**
   * Enter submits the form, as it does in a native text field. The input in
   * the shadow root has no form owner, so the browser's implicit submission
   * never happens on its own -- a login or search form built from this element
   * would otherwise only submit from its button.
   */
  private onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.isComposing || event.defaultPrevented) return;
    const form = this.internals.form;
    if (!form || this.controlDisabled) return;
    event.preventDefault();
    form.requestSubmit();
  };

  render() {
    // IDs are scoped to this shadow root, so they can be literal -- the useId()
    // the React component needs has no counterpart here.
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );

    return (
      <Host>
        <div class="field" part="field">
          {this.label && (
            <label class="label" part="label" htmlFor="input">
              {this.label}
              {this.required && (
                <span class="required" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          <div
            class={{
              control: true,
              'control--invalid': Boolean(this.error),
              'control--disabled': this.controlDisabled,
            }}
            part="control"
          >
            <slot name="prefix" />
            <input
              id="input"
              aria-label={controlAriaLabel(this.el, this.label)}
              part="input"
              class="input"
              type={this.type === 'password' && this.revealed ? 'text' : this.type}
              name={this.name}
              value={this.value}
              placeholder={this.placeholder}
              required={this.required}
              disabled={this.controlDisabled}
              readOnly={this.readonly}
              aria-invalid={this.error ? 'true' : null}
              aria-describedby={describedBy}
              onInput={this.onInput}
              onChange={this.onChange}
              onKeyDown={this.onKeyDown}
            />
            {this.clearable && this.value && !this.controlDisabled && !this.readonly && (
              <button
                type="button"
                class="action"
                part="clear"
                aria-label="Clear"
                onClick={this.clear}
              >
                <pf-icon name="close" aria-hidden="true"></pf-icon>
              </button>
            )}
            {this.revealable && this.type === 'password' && (
              // One label and a pressed state, rather than a label that swaps:
              // the APG's advice for a toggle, so the name a reader learnt stays.
              <button
                type="button"
                class="action"
                part="reveal"
                aria-label="Show password"
                aria-pressed={this.revealed ? 'true' : 'false'}
                disabled={this.controlDisabled}
                onClick={this.toggleReveal}
              >
                <pf-icon name={this.revealed ? 'conceal' : 'reveal'} aria-hidden="true"></pf-icon>
              </button>
            )}
            <slot name="suffix" />
          </div>
          {this.description && (
            <p class="description" part="description" id="description">
              {this.description}
            </p>
          )}
          {this.error && (
            <p class="error" part="error" id="error">
              {this.error}
            </p>
          )}
        </div>
      </Host>
    );
  }
}
