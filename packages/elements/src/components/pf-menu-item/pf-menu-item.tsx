import { isActivationKey } from '@pitchfork-ui/core';
import { Component, Event, EventEmitter, h, Host, Listen, Prop } from '@stencil/core';

/**
 * One action inside a `pf-dropdown` or a `pf-context-menu`.
 *
 * Shared by both, because the React library's `DropdownItem` and
 * `ContextMenuItem` are the same shape and the two menus render them
 * identically — one element rather than two that would drift.
 *
 * It only reports that it was chosen. The menu owns focus, closing and the
 * keyboard pattern, exactly as `pf-radio-group` owns selection for its radios.
 *
 * @slot - the item's label.
 * @slot icon - a leading icon.
 * @slot shortcut - a trailing keyboard hint.
 * @part label - the label's box.
 */
@Component({
  tag: 'pf-menu-item',
  styleUrl: 'pf-menu-item.css',
  shadow: true,
})
export class PfMenuItem {
  /** Identifies the item in the menu's select event. */
  @Prop() value = '';

  /** Reflected so the stylesheet and the menu's item query can select on it. */
  @Prop({ reflect: true }) disabled = false;

  /** Style as a destructive action. Reflected for the stylesheet. */
  @Prop({ reflect: true }) destructive = false;

  /** Asks the menu to act on this item. The menu decides and then closes. */
  @Event() pfMenuSelect!: EventEmitter<{ value: string }>;

  @Listen('click')
  handleClick(event: MouseEvent) {
    if (this.disabled) {
      // A disabled item swallows the click rather than letting the menu's own
      // handler see it as a selection.
      event.stopPropagation();
      return;
    }
    this.pfMenuSelect.emit({ value: this.value });
  }

  /**
   * Enter and Space activate, as they do on a menuitem. The arrows are the
   * menu's: only it knows the other items.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!isActivationKey(event.key) || this.disabled) return;
    event.preventDefault();
    this.pfMenuSelect.emit({ value: this.value });
  }

  render() {
    return (
      <Host role="menuitem" aria-disabled={this.disabled ? 'true' : null}>
        <slot name="icon" />
        <span class="label" part="label">
          <slot />
        </span>
        <slot name="shortcut" />
      </Host>
    );
  }
}
