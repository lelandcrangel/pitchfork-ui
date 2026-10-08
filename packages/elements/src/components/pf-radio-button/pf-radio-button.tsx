import { Component, Element, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

/**
 * One choice inside a `pf-radio-group`.
 *
 * Not form-associated, and deliberately so: a form-associated custom element
 * gets no radio grouping from the browser. Measured — checking a second one
 * leaves the first checked and the form submits *both* values, where native
 * radios submit one. So `pf-radio-group` owns the single-selection invariant
 * and the form value, and this element only asks to be chosen.
 *
 * The control is a native `<input type="radio">` so the dot is the browser's,
 * drawn from `accent-color` exactly as the React component's is. It carries
 * `tabindex="-1"` and the host delegates focus, which means the group governs
 * the tab order through the host while `:focus-visible` still lands on the
 * input the user can see.
 *
 * @slot - the choice's label.
 * @slot description - secondary text below the label.
 * @part input - the native radio.
 * @part label - the label element.
 * @part description - the wrapper around the description slot.
 */
@Component({
  tag: 'pf-radio-button',
  styleUrl: 'pf-radio-button.css',
  shadow: { delegatesFocus: true },
})
export class PfRadioButton {
  @Element() el!: HTMLElement;

  /** Submitted by the group when this choice is the selected one. */
  /**
   * Reflected because the generated bindings set props as properties, so
   * without it a consumer selecting `pf-radio-button[value="..."]` in a React
   * or Angular app finds nothing. The group reads the property, so this was
   * never a live defect here -- it is the same trap that was one in
   * `pf-command-item`.
   */
  @Prop({ reflect: true }) value = '';

  /**
   * Whether this is the chosen one. The group sets this — a consumer who sets
   * it directly will have it overwritten the next time the group syncs.
   */
  @Prop({ mutable: true, reflect: true }) checked = false;

  /** Disable this choice alone. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) disabled = false;

  /** Asks the group to select this choice. The group decides. */
  @Event() pfRadioSelect!: EventEmitter<{ value: string }>;

  /**
   * The native input checks itself the instant it is clicked, before the group
   * has had any say. Writing the property back on every render is what undoes
   * that when the group declines — a disabled group, or a value the consumer
   * is holding. Guarded on inequality so an unrelated re-render does not
   * disturb it.
   */
  componentDidRender() {
    const input = this.el.shadowRoot?.querySelector('input');
    if (input && input.checked !== this.checked) {
      input.checked = this.checked;
    }
  }

  private onChange = () => {
    /*
     * Put the dot back before asking, every time. The native input has already
     * moved it, and nothing here knows yet whether the group will agree — it
     * may be disabled, this choice may be disabled, or a consumer may be
     * holding `value`. Restoring first makes every one of those paths correct
     * without the group having to undo anything; when it does agree, `checked`
     * flips and the next render writes the dot back on.
     */
    const input = this.el.shadowRoot?.querySelector('input');
    if (input) input.checked = this.checked;

    if (this.disabled) return;
    this.pfRadioSelect.emit({ value: this.value });
  };

  render() {
    return (
      <Host>
        <input
          id="input"
          part="input"
          class="input"
          type="radio"
          // Never an independent tab stop: the group drives the tab order
          // through the host, and the host delegates focus down to here.
          tabindex="-1"
          checked={this.checked}
          disabled={this.disabled}
          onChange={this.onChange}
        />
        <label class="text" part="label" htmlFor="input">
          <span class="label-text">
            <slot />
          </span>
          <span class="description" part="description">
            <slot name="description" />
          </span>
        </label>
      </Host>
    );
  }
}
