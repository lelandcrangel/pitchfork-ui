import {
  clampNumber,
  composeDescribedBy,
  formatNumberValue,
  Keys,
  parseNumberValue,
  roundToStep,
  stepNumber,
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
  State,
  Watch,
} from '@stencil/core';

import { applyControlValidity } from '../../form-validity';

/**
 * A form-associated stepper field.
 *
 * The value is a **string** rather than a number, because that is what an
 * attribute can carry and what a form submits; `pfChange` reports the parsed
 * number beside it, which is what a framework consumer wants. An empty string
 * is an empty field — not zero, which is a value someone chose.
 *
 * All of the arithmetic is core's, so this and the React `NumberInput` step,
 * round and clamp identically: ten steps of `0.1` reach exactly 1 in both.
 *
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part control - the box holding the steppers and the input.
 * @part decrement - the step-down button.
 * @part input - the native input.
 * @part increment - the step-up button.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-number-input',
  styleUrl: 'pf-number-input.css',
  formAssociated: true,
  shadow: { delegatesFocus: true },
})
export class PfNumberInput {
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /**
   * Submitted under this name. Reflected, because a form-associated element
   * takes its submission name from the attribute, not this property.
   */
  @Prop({ reflect: true }) name?: string;

  /** The value, as a string. Empty means an empty field. */
  @Prop({ mutable: true }) value = '';

  /** The lowest value the field accepts. */
  @Prop() min?: number;

  /** The highest value the field accepts. */
  @Prop() max?: number;

  /** How far one step moves, and what the result is rounded to. */
  @Prop() step = 1;

  /** Visible label. Rendered in the same root as the input, so `for` works. */
  @Prop() label?: string;

  /** Hint text below the control. */
  @Prop() description?: string;

  /** Error message. Its presence is what marks the control invalid. */
  @Prop() error?: string;

  @Prop() placeholder?: string;

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** The step-down button's accessible name. */
  @Prop() decrementLabel = 'Decrease';

  /** The step-up button's accessible name. */
  @Prop() incrementLabel = 'Increase';

  /** Fires when the value changes, with the parsed number beside the string. */
  @Event() pfChange!: EventEmitter<{ value: string; number: number | null }>;

  /**
   * What the input shows while it is being edited, which is not always the
   * value: a half-typed "-" or "1." is neither a number nor a reason to throw
   * the keystroke away.
   */
  @State() draft: string | null = null;

  /** The value a form reset restores, which is the initial attribute. */
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

  /** A reset restores the value the field started with. */
  formResetCallback() {
    this.value = this.initialValue;
    this.draft = null;
  }

  /** Steps the value up or down, as the buttons and the arrows do. */
  @Method()
  async stepBy(direction: 1 | -1): Promise<void> {
    this.step_(direction);
  }

  private get bounds() {
    return {
      min: this.min === undefined ? -Infinity : Number(this.min),
      max: this.max === undefined ? Infinity : Number(this.max),
      step: Number(this.step) || 1,
    };
  }

  private get current(): number | null {
    return parseNumberValue(this.value);
  }

  private get atMin(): boolean {
    const { min } = this.bounds;
    return this.current !== null && this.current <= min;
  }

  private get atMax(): boolean {
    const { max } = this.bounds;
    return this.current !== null && this.current >= max;
  }

  private commit(next: number | null) {
    const { min, max, step } = this.bounds;
    const value = next === null ? '' : String(roundToStep(clampNumber(next, min, max), step));
    if (value === this.value) return;

    this.value = value;
    this.pfChange.emit({ value, number: parseNumberValue(value) });
  }

  private step_(direction: 1 | -1) {
    if (this.disabled) return;
    this.draft = null;
    this.commit(stepNumber(this.current, direction, this.bounds));
  }

  private onInput = (event: Event) => {
    const raw = (event.target as HTMLInputElement).value;
    /*
     * The draft is kept as typed and the value follows it, rather than the
     * input being rewritten from the value: clamping mid-keystroke would make
     * "5" unreachable in a field whose minimum is 50, and rounding would eat
     * the "." of "1.5" as it was typed.
     */
    this.draft = raw;
    const parsed = parseNumberValue(raw);
    if (raw.trim() === '') {
      this.commit(null);
      return;
    }
    if (parsed !== null) this.commit(parsed);
  };

  /** On blur the draft is given up, so the field shows its real value. */
  private onBlur = () => {
    this.draft = null;
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.disabled) return;
    const { min, max } = this.bounds;

    if (event.key === Keys.ArrowUp) {
      event.preventDefault();
      this.step_(1);
    } else if (event.key === Keys.ArrowDown) {
      event.preventDefault();
      this.step_(-1);
    } else if (event.key === Keys.Home && Number.isFinite(min)) {
      event.preventDefault();
      this.draft = null;
      this.commit(min);
    } else if (event.key === Keys.End && Number.isFinite(max)) {
      event.preventDefault();
      this.draft = null;
      this.commit(max);
    }
  };

  render() {
    // IDs are scoped to this shadow root, so they can be literal.
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );
    const { min, max } = this.bounds;
    const shown = this.draft ?? formatNumberValue(this.current);

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

          <div class={{ control: true, 'control--invalid': Boolean(this.error) }} part="control">
            {/*
              The steppers are out of the tab order and the arrows are on the
              input, which is the spinbutton pattern: a keyboard user steps
              without leaving the field. `mousedown` is prevented so a click
              does not take focus off it either.
            */}
            <button
              type="button"
              class="step"
              part="decrement"
              aria-label={this.decrementLabel}
              disabled={this.disabled || this.atMin}
              tabindex="-1"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => this.step_(-1)}
            >
              <pf-icon name="minus" aria-hidden="true"></pf-icon>
            </button>

            <input
              id="input"
              part="input"
              class="input"
              type="text"
              inputMode="decimal"
              role="spinbutton"
              name={this.name}
              value={shown}
              placeholder={this.placeholder}
              required={this.required}
              disabled={this.disabled}
              autocomplete="off"
              aria-invalid={this.error ? 'true' : null}
              aria-describedby={describedBy}
              aria-valuenow={this.current ?? null}
              aria-valuemin={Number.isFinite(min) ? min : null}
              aria-valuemax={Number.isFinite(max) ? max : null}
              onInput={this.onInput}
              onBlur={this.onBlur}
              onKeyDown={this.onKeyDown}
            />

            <button
              type="button"
              class="step"
              part="increment"
              aria-label={this.incrementLabel}
              disabled={this.disabled || this.atMax}
              tabindex="-1"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => this.step_(1)}
            >
              <pf-icon name="plus" aria-hidden="true"></pf-icon>
            </button>
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
