import { formatValueList, parseValueList } from '@pitchfork-ui/core';
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

import { controlAriaLabel } from '../../control-label';
import { applyControlValidity } from '../../form-validity';

export type PfCheckboxGroupOrientation = 'vertical' | 'horizontal';

type Checkbox = HTMLElement & { value: string; checked: boolean; disabled: boolean };

/**
 * A form-associated group of `pf-checkbox` children, with one legend, one
 * error and one submission.
 *
 * The group is the control, as `pf-radio-group` is: it holds the `name` and
 * the `value`, and the checkboxes only say which of them is ticked. Give each
 * child a `value` and no `name` — a named child would submit itself as well.
 * The group submits one entry per ticked value under its own name, which is
 * how a set of native checkboxes sharing a name arrives, so
 * `formData.getAll(name)` reads them back as an array.
 *
 * `value` is the ticked values, comma-separated, because that is what an
 * attribute can carry; `pfChange` also reports them as an array. With no
 * `value` given, the children's own `checked` attributes set the starting
 * state, so either spelling works in markup.
 *
 * `required` means at least one must be ticked.
 *
 * @slot - the `pf-checkbox` children.
 * @part field - the wrapper around legend, choices and messages.
 * @part legend - the group's heading.
 * @part description - the hint below the legend.
 * @part choices - the container the children are slotted into.
 * @part error - the error message below the group.
 */
@Component({
  tag: 'pf-checkbox-group',
  styleUrl: 'pf-checkbox-group.css',
  formAssociated: true,
  shadow: true,
})
export class PfCheckboxGroup {
  @Element() el!: HTMLElement;

  @AttachInternals() internals!: ElementInternals;

  /**
   * Submitted under this name, once per ticked value. Reflected for
   * consumers' selectors; the submission itself is a FormData built here.
   */
  @Prop({ reflect: true }) name?: string;

  /** The ticked values, comma-separated. Reflected, so HTML can set it. */
  @Prop({ mutable: true, reflect: true }) value = '';

  /** The group's heading. */
  @Prop() legend?: string;

  /** A hint below the legend. */
  @Prop() description?: string;

  /** Error message. Its presence is what marks the group invalid. */
  @Prop() error?: string;

  /** Layout of the choices. Reflected for the stylesheet. */
  @Prop({ reflect: true }) orientation: PfCheckboxGroupOrientation = 'vertical';

  /** At least one choice must be ticked. */
  @Prop({ reflect: true }) required = false;

  /** Disable every choice. Reflected for the stylesheet. */
  @Prop({ reflect: true }) disabled = false;

  /** Fires when a choice is ticked or unticked. */
  @Event() pfChange!: EventEmitter<{ value: string; values: string[] }>;

  /**
   * Whether the platform says this control is disabled -- by its own
   * `disabled` or by an enclosing `<fieldset disabled>`.
   */
  @State() formDisabled = false;

  /** The value a form reset restores. */
  private initialValue = '';

  /** Children whose `pfChange` this group already catches. */
  private bound = new WeakSet<HTMLElement>();

  /** Each child's own `disabled`, kept while the group overrides it. */
  private ownDisabled = new WeakMap<HTMLElement, boolean>();

  componentWillLoad() {
    /*
     * With no value given, the children's `checked` attributes are the
     * starting state, so `<pf-checkbox checked>` works inside a group too.
     * Read here, before the first render: the slot's first `slotchange` pushes
     * the group's value down, and with an empty value that unticks them all.
     * The property if a child has upgraded, the attribute if not yet.
     */
    if (!this.value) {
      const ticked = this.checkboxes
        .filter((box) => box.checked ?? box.hasAttribute('checked'))
        .map((box) => box.value ?? box.getAttribute('value') ?? 'on');
      if (ticked.length > 0) this.value = formatValueList(ticked);
    }
    this.initialValue = this.value;
    this.syncFormState();
  }

  componentDidLoad() {
    this.syncChildren();
  }

  formDisabledCallback(disabled: boolean) {
    this.formDisabled = disabled;
  }

  private get controlDisabled() {
    return this.disabled || this.formDisabled;
  }

  /*
   * `name` is watched because it is built into the FormData below, which the
   * platform cannot update by itself the way it does a plain string value.
   */
  @Watch('name')
  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    const values = parseValueList(this.value);
    if (values.length === 0 || !this.name) {
      this.internals.setFormValue(null);
    } else {
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.internals.setFormValue(data);
    }
    applyControlValidity(this.internals, values.length > 0, this.required, this.error);
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

  /**
   * A reset restores the choices the group started with, and pushes them down
   * even when the value has not changed, so a child that was ticked directly
   * is put back too.
   */
  formResetCallback() {
    this.value = this.initialValue;
    this.syncChildren();
  }

  /** The direct `pf-checkbox` children, in source order. */
  private get checkboxes(): Checkbox[] {
    return Array.from(this.el.children).filter(
      (child): child is Checkbox => child.localName === 'pf-checkbox',
    );
  }

  /** Pushes the group's value and disabled state down to its children. */
  @Watch('value')
  @Watch('disabled')
  @Watch('formDisabled')
  syncChildren() {
    const ticked = new Set(parseValueList(this.value));
    for (const box of this.checkboxes) {
      this.bind(box);
      box.checked = ticked.has(box.value);

      if (this.controlDisabled) {
        if (!this.ownDisabled.has(box)) this.ownDisabled.set(box, box.disabled);
        box.disabled = true;
      } else if (this.ownDisabled.has(box)) {
        box.disabled = this.ownDisabled.get(box) ?? false;
        this.ownDisabled.delete(box);
      }
    }
  }

  /**
   * Catches a child's `pfChange` on the child itself.
   *
   * The child's event and this group's share a name, and a listener on the
   * host could not keep the child's from a consumer's listener on that same
   * host: `stopPropagation()` never stops a same-node listener. Stopped here,
   * it never reaches the host, so a listener on the group hears the group.
   */
  private bind(box: Checkbox) {
    if (this.bound.has(box)) return;
    this.bound.add(box);
    box.addEventListener('pfChange', (event) => {
      event.stopPropagation();
      if (this.controlDisabled) return;
      const values = this.checkboxes.filter((child) => child.checked).map((child) => child.value);
      this.value = formatValueList(values);
      this.pfChange.emit({ value: this.value, values });
    });
  }

  render() {
    const describedBy =
      [this.description && 'description', this.error && 'error'].filter(Boolean).join(' ') || null;

    /*
     * The group role sits on the shadow wrapper, as in `pf-radio-group`: the
     * legend and the messages live in this shadow root, where IDREFs from the
     * wrapper resolve, and the slotted checkboxes are still inside the group
     * in the flattened tree.
     */
    return (
      <Host>
        <div
          class="field"
          part="field"
          role="group"
          aria-labelledby={this.legend ? 'legend' : null}
          aria-label={controlAriaLabel(this.el, this.legend)}
          aria-describedby={describedBy}
        >
          {this.legend && (
            <span class="legend" part="legend" id="legend">
              {this.legend}
              {this.required && (
                <span class="required" aria-hidden="true">
                  {' '}
                  *
                </span>
              )}
            </span>
          )}
          {this.description && (
            <p class="description" part="description" id="description">
              {this.description}
            </p>
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
