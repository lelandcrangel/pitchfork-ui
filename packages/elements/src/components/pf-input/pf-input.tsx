import { composeDescribedBy } from '@pitchfork-ui/core';
import { applyControlValidity } from '../../form-validity';
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
  syncFormState() {
    this.internals.setFormValue(this.value ?? '');
    applyControlValidity(this.internals, Boolean(this.value), this.required, this.error);
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
