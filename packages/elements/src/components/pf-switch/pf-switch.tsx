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

import { applyControlValidity } from '../../form-validity';

/**
 * A form-associated on/off switch.
 *
 * Built on a native checkbox with `role="switch"`, exactly as the React
 * component is: a switch is a checkbox whose two states are "on" and "off"
 * rather than "selected" and "not selected", and the role is the only
 * difference assistive technology needs.
 *
 * @part field - the wrapper around control and label.
 * @part input - the native checkbox carrying role="switch".
 * @part label - the label element.
 */
@Component({
  tag: 'pf-switch',
  styleUrl: 'pf-switch.css',
  formAssociated: true,
  shadow: { delegatesFocus: true },
})
export class PfSwitch {
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

  /** Whether the switch is on. Reflected so the stylesheet can select on it. */
  @Prop({ mutable: true, reflect: true }) checked = false;

  /**
   * What is submitted when on. Mirrors the native attribute, whose default is
   * also `on` — a checkbox with no value still submits something.
   */
  @Prop() value = 'on';

  /** Visible label, rendered in the same root so `for` actually associates. */
  @Prop() label?: string;

  /** Error message. Its presence is what marks the control invalid. */
  @Prop() error?: string;

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Fires when the user turns the switch on or off. */
  @Event() pfChange!: EventEmitter<{ checked: boolean; value: string }>;

  /** The state a form reset restores, which is the initial attribute. */
  private initialChecked = false;

  componentWillLoad() {
    this.initialChecked = this.checked;
    this.syncFormState();
  }

  @Watch('checked')
  @Watch('error')
  @Watch('required')
  @Watch('value')
  syncFormState() {
    /*
     * `null`, not an empty string, when off: an unchecked checkbox is
     * absent from the submission entirely, rather than present and empty.
     * That is what a server distinguishing "unticked" from "not sent" relies
     * on, and it is what a native checkbox does.
     */
    this.internals.setFormValue(this.checked ? this.value : null);
    applyControlValidity(this.internals, this.checked, this.required, this.error);
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

  /**
   * A reset restores the initial state, not `false` — a native
   * `<input type=checkbox checked>` comes back on.
   */
  formResetCallback() {
    this.checked = this.initialChecked;
  }

  private onChange = (event: Event) => {
    this.checked = (event.target as HTMLInputElement).checked;
    this.pfChange.emit({ checked: this.checked, value: this.value });
  };

  render() {
    return (
      <Host>
        <div class="field" part="field">
          <input
            id="input"
            part="input"
            class="input"
            type="checkbox"
            role="switch"
            name={this.name}
            value={this.value}
            checked={this.checked}
            required={this.required}
            disabled={this.disabled}
            aria-invalid={this.error ? 'true' : null}
            aria-describedby={this.error ? 'error' : null}
            onChange={this.onChange}
          />
          {this.label && (
            <label class="label" part="label" htmlFor="input">
              {this.label}
            </label>
          )}
        </div>
        {this.error && (
          <p class="error" part="error" id="error">
            {this.error}
          </p>
        )}
      </Host>
    );
  }
}
