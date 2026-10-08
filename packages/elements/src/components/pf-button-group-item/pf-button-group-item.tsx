import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

/**
 * One button inside a `pf-button-group`.
 *
 * It only reports that it was pressed; the group owns the selection, exactly
 * as `pf-radio-group` does for its radios. The group writes `selected` and
 * `groupDisabled` back onto it.
 *
 * `aria-pressed` rather than `aria-checked`: these are toggle buttons, not
 * radios, which is also why every one of them is a tab stop.
 *
 * @slot - the button's label.
 * @part button - the button itself.
 * @part icon - the leading icon, when `icon` is set.
 * @part dot - the leading dot, when `dot` is set.
 * @part label - the label's box.
 */
@Component({
  tag: 'pf-button-group-item',
  styleUrl: 'pf-button-group-item.css',
  shadow: true,
})
export class PfButtonGroupItem {
  /**
   * The value the group reports when this button is chosen.
   *
   * Reflected, because the generated bindings set props as *properties*: an
   * unreflected prop leaves no attribute, and anything selecting on one — a
   * consumer's stylesheet, or a test — finds nothing.
   */
  @Prop({ reflect: true }) value = '';

  /** Disable this button alone. Reflected for the stylesheet. */
  @Prop({ reflect: true }) disabled = false;

  /**
   * Set by the group when the whole group is disabled, kept apart from
   * `disabled` so that enabling the group does not enable a button the
   * consumer disabled on its own.
   */
  @Prop({ mutable: true, reflect: true }) groupDisabled = false;

  /** Set by the group. Reflected, so the stylesheet can mark the choice. */
  @Prop({ mutable: true, reflect: true }) selected = false;

  /** A leading icon's name, from the same registry as `pf-icon`. */
  @Prop() icon?: string;

  /** Draw a leading dot — a status light rather than an icon. */
  @Prop({ reflect: true }) dot = false;

  /** Asks the group to choose this button. The group decides. */
  @Event() pfButtonGroupSelect!: EventEmitter<{ value: string }>;

  private onClick = () => {
    if (this.disabled || this.groupDisabled) return;
    this.pfButtonGroupSelect.emit({ value: this.value });
  };

  render() {
    const off = this.disabled || this.groupDisabled;

    return (
      <Host>
        <button
          type="button"
          class="button"
          part="button"
          aria-pressed={this.selected ? 'true' : 'false'}
          disabled={off}
          onClick={this.onClick}
        >
          {this.icon && (
            <pf-icon class="icon" part="icon" name={this.icon} aria-hidden="true"></pf-icon>
          )}
          {this.dot && <span class="dot" part="dot" aria-hidden="true"></span>}
          <span class="label" part="label">
            <slot />
          </span>
        </button>
      </Host>
    );
  }
}
