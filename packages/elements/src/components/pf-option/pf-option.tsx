import { Component, Element, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

/**
 * One choice inside a `pf-select`.
 *
 * It only reports that it was chosen; the select owns the value, the active
 * option and closing — the same division as `pf-radio-group` with its radios
 * and `pf-dropdown` with its menu items. The select writes `selected` and
 * `active` back onto it, so the stylesheet has reflected attributes to select
 * on without the option knowing anything about its container.
 *
 * @slot - the option's label, which is also what typeahead searches.
 */
@Component({
  tag: 'pf-option',
  styleUrl: 'pf-option.css',
  shadow: true,
})
export class PfOption {
  @Element() el!: HTMLElement;

  /**
   * The value the select reports when this option is chosen.
   *
   * Reflected, because the generated bindings set props as *properties*: an
   * unreflected prop leaves no attribute, and anything selecting on one — a
   * consumer's stylesheet, or a test — finds nothing.
   */
  @Prop({ reflect: true }) value = '';

  /** Reflected; the stylesheet and the select's own query both read it. */
  @Prop({ reflect: true }) disabled = false;

  /** Set by the select. Reflected, so the stylesheet can mark the choice. */
  @Prop({ mutable: true, reflect: true }) selected = false;

  /** Set by the select: the option the keyboard is on. Reflected likewise. */
  @Prop({ mutable: true, reflect: true }) active = false;

  /** Asks the select to take this value. The select decides and closes. */
  @Event() pfOptionSelect!: EventEmitter<{ value: string }>;

  /**
   * Mouse only. Keyboard focus stays on the select's trigger and the active
   * option is tracked with `aria-activedescendant`, so an option never has
   * focus to receive a key on.
   */
  private onClick = (event: MouseEvent) => {
    if (this.disabled) {
      event.stopPropagation();
      return;
    }
    this.pfOptionSelect.emit({ value: this.value });
  };

  render() {
    return (
      <Host
        role="option"
        aria-selected={this.selected ? 'true' : 'false'}
        aria-disabled={this.disabled ? 'true' : null}
        onClick={this.onClick}
      >
        <slot />
      </Host>
    );
  }
}
