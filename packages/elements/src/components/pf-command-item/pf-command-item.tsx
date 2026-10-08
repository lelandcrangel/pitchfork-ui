import { Component, Element, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

/**
 * One command in a `pf-command-palette`.
 *
 * It only reports that it was chosen; the palette owns filtering, the active
 * option and closing, exactly as `pf-radio-group` owns selection for its
 * radios and `pf-dropdown` owns it for its menu items.
 *
 * @slot - the command's label, which is also what the palette searches.
 * @slot icon - a leading icon.
 * @part label - the label's box.
 * @part description - the supporting line.
 */
@Component({
  tag: 'pf-command-item',
  styleUrl: 'pf-command-item.css',
  shadow: true,
})
export class PfCommandItem {
  @Element() el!: HTMLElement;

  /**
   * Identifies the command in the palette's select event.
   *
   * Reflected, and not only for tidiness: the generated React and Angular
   * bindings set props as *properties*, so without this there is no `value`
   * attribute and anything selecting on one — the palette's own item query
   * included — finds nothing. The same defect as an unreflected `name` on a
   * form control, and caught the same way, by the consumer apps.
   */
  @Prop({ reflect: true }) value = '';

  /** A supporting line under the label. Searched along with the label. */
  @Prop() description?: string;

  /** Reflected so the stylesheet and the palette's item query can select on it. */
  @Prop({ reflect: true }) disabled = false;

  /** Asks the palette to run this command. The palette decides and closes. */
  @Event() pfCommandSelect!: EventEmitter<{ value: string }>;

  /**
   * Mouse only. The palette keeps keyboard focus in its input and tracks the
   * active option with `aria-activedescendant`, so Enter is the palette's to
   * handle — an item never has focus to receive a key on.
   */
  private onClick = (event: MouseEvent) => {
    if (this.disabled) {
      event.stopPropagation();
      return;
    }
    this.pfCommandSelect.emit({ value: this.value });
  };

  render() {
    return (
      <Host role="option" aria-disabled={this.disabled ? 'true' : null} onClick={this.onClick}>
        <slot name="icon" />
        <span class="content">
          <span class="label" part="label">
            <slot />
          </span>
          {this.description && (
            <span class="description" part="description">
              {this.description}
            </span>
          )}
        </span>
      </Host>
    );
  }
}
