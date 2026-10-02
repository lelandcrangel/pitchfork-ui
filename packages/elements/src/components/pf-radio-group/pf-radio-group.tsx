import { resolveListMove, resolveRovingKey, syncRovingTabIndex } from '@pitchfork-ui/core';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Method,
  Prop,
  Watch,
} from '@stencil/core';

import { applyControlValidity } from '../../form-validity';

export type PfRadioGroupOrientation = 'vertical' | 'horizontal';

/**
 * A form-associated group of `pf-radio-button` children.
 *
 * The group is the control, not the radios: it holds the one `name` and the
 * one `value`, because a form-associated custom element gets no radio grouping
 * from the browser. Measured — three independent form-associated elements with
 * the same name all stay checked and all submit. So single selection is this
 * element's job, and it is the only one of the pair that touches the form.
 *
 * Keyboard follows the ARIA radiogroup pattern rather than the toolbar one:
 * the group is a single tab stop, and the arrows both move and select.
 *
 * @slot - the `pf-radio-button` children.
 * @part field - the wrapper around legend, choices and error.
 * @part legend - the group's heading.
 * @part choices - the container the children are slotted into.
 * @part error - the error message below the group.
 */
@Component({
  tag: 'pf-radio-group',
  styleUrl: 'pf-radio-group.css',
  formAssociated: true,
  shadow: true,
})
export class PfRadioGroup {
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /**
   * Submitted under this name. Reflected, because a form-associated element
   * takes its submission name from the attribute, not this property.
   */
  @Prop({ reflect: true }) name?: string;

  /** The selected choice's value. Empty means nothing is selected. */
  @Prop({ mutable: true }) value = '';

  /** The group's heading. */
  @Prop() legend?: string;

  /** Error message. Its presence is what marks the group invalid. */
  @Prop() error?: string;

  /** Layout and arrow-key axis. Reflected for the stylesheet. */
  @Prop({ reflect: true }) orientation: PfRadioGroupOrientation = 'vertical';

  @Prop({ reflect: true }) required = false;

  /** Disable every choice. Reflected for the stylesheet. */
  @Prop({ reflect: true }) disabled = false;

  /** Fires when the selection changes. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /** The value a form reset restores, which is the initial attribute. */
  private initialValue = '';

  componentWillLoad() {
    this.initialValue = this.value;
    this.syncFormState();
  }

  componentDidLoad() {
    this.syncChildren();
  }

  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    /*
     * `null`, not an empty string, with nothing selected: a radio group where
     * no choice is picked is absent from the submission, exactly as a set of
     * native radios with none checked is.
     */
    this.internals.setFormValue(this.value || null);
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

  /** The message explaining why the group is invalid, or an empty string. */
  @Method()
  async getValidationMessage(): Promise<string> {
    return this.internals.validationMessage;
  }

  /** A reset restores the choice the group started with. */
  formResetCallback() {
    this.value = this.initialValue;
    this.syncChildren();
  }

  /** The choices, in source order. */
  private get radios(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll('pf-radio-button'));
  }

  private isDisabled(radio: HTMLElement) {
    return this.disabled || radio.hasAttribute('disabled');
  }

  /**
   * Pushes the group's state onto its children: one checked, the rest not, and
   * exactly one tab stop.
   *
   * The ARIA pattern puts the tab stop on the *selected* choice rather than on
   * whichever was focused last, so that tabbing into the group lands on the
   * current answer. With nothing selected it falls to the first enabled one,
   * which is how a user reaches an unanswered group at all.
   */
  @Watch('value')
  @Watch('disabled')
  syncChildren() {
    const radios = this.radios;
    if (radios.length === 0) return;

    for (const radio of radios) {
      const selected = (radio as HTMLElement & { value: string }).value === this.value;
      (radio as HTMLElement & { checked: boolean }).checked = selected;
      radio.setAttribute('aria-checked', selected ? 'true' : 'false');
    }

    const enabled = radios.filter((radio) => !this.isDisabled(radio));
    const checked = enabled.find(
      (radio) => (radio as HTMLElement & { value: string }).value === this.value,
    );
    // Only the enabled choices are tab stops; a disabled one is never reachable.
    syncRovingTabIndex(enabled, checked ?? enabled[0]);
    for (const radio of radios) {
      if (this.isDisabled(radio)) radio.tabIndex = -1;
    }
  }

  @Listen('pfRadioSelect')
  handleSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    if (this.disabled) return;

    const next = event.detail.value;
    if (next === this.value) return;

    this.value = next;
    this.syncChildren();
    this.pfChange.emit({ value: next });
  }

  /**
   * In a radiogroup the arrows move *and* select — unlike a toolbar, where
   * they only move. Disabled choices are skipped entirely, which is why the
   * index maths runs over the enabled subset rather than over all children.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented || this.disabled) return;

    const action = resolveRovingKey(event.key, this.orientation);
    if (!action) return;

    const enabled = this.radios.filter((radio) => !this.isDisabled(radio));
    if (enabled.length === 0) return;

    const currentIndex = enabled.indexOf(document.activeElement as HTMLElement);
    const nextIndex = resolveListMove(
      action,
      enabled.map((_, index) => index),
      currentIndex,
    );
    if (nextIndex < 0) return;

    event.preventDefault();
    const target = enabled[nextIndex] as HTMLElement & { value: string };
    this.value = target.value;
    this.syncChildren();
    target.focus();
    this.pfChange.emit({ value: target.value });
  }

  render() {
    return (
      <Host
        role="radiogroup"
        aria-labelledby={this.legend ? 'legend' : null}
        aria-describedby={this.error ? 'error' : null}
        aria-invalid={this.error ? 'true' : null}
        aria-required={this.required ? 'true' : null}
      >
        <div class="field" part="field">
          {this.legend && (
            <span class="legend" part="legend" id="legend">
              {this.legend}
            </span>
          )}
          <div class="choices" part="choices">
            <slot onSlotchange={() => this.syncChildren()} />
          </div>
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
