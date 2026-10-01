import { composeDescribedBy } from '@pitchfork-ui/core';
import {
  AttachInternals,
  Component,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  Watch,
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
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part input - the native input.
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
  @AttachInternals() internals!: ElementInternals;

  /** Submitted under this name. */
  @Prop() name?: string;

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

  /** Fires on every keystroke, like the native `input` event. */
  @Event() pfInput!: EventEmitter<{ value: string }>;

  /** Fires when the value is committed, like the native `change` event. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  componentWillLoad() {
    this.syncFormState();
  }

  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    this.internals.setFormValue(this.value ?? '');

    if (this.error) {
      this.internals.setValidity({ customError: true }, this.error);
      return;
    }

    if (this.required && !this.value) {
      this.internals.setValidity({ valueMissing: true }, 'This field is required.');
      return;
    }

    this.internals.setValidity({});
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

  /** The form resetting has to clear the control, not just the form value. */
  formResetCallback() {
    this.value = '';
  }

  private onInput = (event: Event) => {
    this.value = (event.target as HTMLInputElement).value;
    this.pfInput.emit({ value: this.value });
  };

  private onChange = () => {
    this.pfChange.emit({ value: this.value });
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
          <input
            id="input"
            part="input"
            class={{ input: true, 'input--invalid': Boolean(this.error) }}
            type={this.type}
            name={this.name}
            value={this.value}
            placeholder={this.placeholder}
            required={this.required}
            disabled={this.disabled}
            readOnly={this.readonly}
            aria-invalid={this.error ? 'true' : null}
            aria-describedby={describedBy}
            onInput={this.onInput}
            onChange={this.onChange}
          />
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
