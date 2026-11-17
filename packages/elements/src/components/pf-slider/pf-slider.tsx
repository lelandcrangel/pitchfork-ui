import {
  snapToRangeStep,
  composeDescribedBy,
  getRangePercent,
  normalizeRange,
} from '@pitchfork-ui/core';
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

import { applyControlValidity } from '../../form-validity';
import { controlAriaLabel } from '../../control-label';

/**
 * A form-associated range slider.
 *
 * A native `<input type="range">`, as the React component is — the drag, the
 * keyboard stepping and the touch handling are all the browser's, and nothing
 * here reimplements them.
 *
 * @part field - the wrapper around header, control and messages.
 * @part header - the row holding the label and the readout.
 * @part label - the label element.
 * @part value - the numeric readout.
 * @part input - the native range input.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-slider',
  styleUrl: 'pf-slider.css',
  formAssociated: true,
  shadow: { delegatesFocus: true },
})
export class PfSlider {
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /**
   * Submitted under this name. Reflected, because a form-associated element
   * takes its submission name from the attribute, not this property.
   */
  @Prop({ reflect: true }) name?: string;

  /** The control's value. */
  @Prop({ mutable: true }) value = 0;

  @Prop() min = 0;

  @Prop() max = 100;

  @Prop() step = 1;

  /** Visible label, rendered in the same root so `for` actually associates. */
  @Prop() label?: string;

  /** Hint text below the control. */
  @Prop() description?: string;

  /** Error message. Its presence is what marks the control invalid. */
  @Prop() error?: string;

  /** Show the current value beside the label. Reflected for the stylesheet. */
  @Prop({ reflect: true }) showValue = true;

  @Prop({ reflect: true }) disabled = false;

  /** Fires as the user drags, like the native `input` event. */
  @Event() pfInput!: EventEmitter<{ value: number }>;

  /** Fires when the value is committed, like the native `change` event. */
  @Event() pfChange!: EventEmitter<{ value: number }>;

  /** The value a form reset restores, which is the initial attribute. */
  private initialValue = 0;

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormState();
  }

  @Watch('value')
  @Watch('error')
  @Watch('min')
  @Watch('max')
  syncFormState() {
    this.internals.setFormValue(`${this.current}`);
    /*
     * A slider always has a value — it cannot be empty the way a text field
     * can — so `required` would never fail and the element does not offer it.
     * Only an explicit error can make this control invalid.
     */
    applyControlValidity(this.internals, true, false, this.error);
  }

  /** A form-associated custom element does not inherit this. */
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

  /** A reset restores the value the control started with. */
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

  /** The bounds, with a non-finite or inverted range made drawable. */
  private get range() {
    return normalizeRange(Number(this.min), Number(this.max), Number(this.step));
  }

  /**
   * The value as rendered and submitted: inside the bounds and on a step, which
   * is where the browser puts the native thumb anyway. Clamping alone left the
   * fill, the label and the form saying 33 over a thumb sitting at 30.
   */
  private get current() {
    const { min, max, step } = this.range;
    return snapToRangeStep(Number(this.value), min, max, step);
  }

  private onInput = (event: Event) => {
    this.value = Number((event.target as HTMLInputElement).value);
    this.pfInput.emit({ value: this.value });
  };

  private onChange = () => {
    this.pfChange.emit({ value: this.current });
  };

  render() {
    const { min, max, step } = this.range;
    const current = this.current;
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );

    return (
      <Host>
        <div class="field" part="field">
          {(this.label || this.showValue) && (
            <div class="header" part="header">
              {this.label ? (
                <label class="label" part="label" htmlFor="input">
                  {this.label}
                </label>
              ) : (
                <span />
              )}
              {this.showValue && (
                // aria-hidden: the input already reports its value to
                // assistive technology through the range role.
                <span class="value" part="value" aria-hidden="true">
                  {/* Not rounded: on step="0.1" a value of 0.5 read "1". */}
                  {current}
                </span>
              )}
            </div>
          )}

          <input
            id="input"
            aria-label={controlAriaLabel(this.el, this.label)}
            part="input"
            class={{ slider: true, 'slider--invalid': Boolean(this.error) }}
            type="range"
            name={this.name}
            value={`${current}`}
            min={`${min}`}
            max={`${max}`}
            step={`${step}`}
            disabled={this.controlDisabled}
            aria-invalid={this.error ? 'true' : null}
            aria-describedby={describedBy}
            onInput={this.onInput}
            onChange={this.onChange}
            style={{ '--pf-slider-progress': `${getRangePercent(current, min, max)}%` }}
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
