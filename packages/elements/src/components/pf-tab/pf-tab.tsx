import { isActivationKey } from '@pitchfork-ui/core';
import { Component, Element, Event, EventEmitter, h, Host, Listen, Prop } from '@stencil/core';

import type { PfTabsSize, PfTabsVariant } from '../pf-tabs/pf-tabs';

export type PfTabPlacement = 'start' | 'end';

/**
 * One tab inside a `pf-tabs`.
 *
 * It only reports that it was chosen; the group owns the selection, the single
 * tab stop and the id wiring — the same division as `pf-radio-group` with its
 * radios and `pf-select` with its options. The group writes `selected`,
 * `variant`, `size` and `full-width` back onto it, so the stylesheet has
 * reflected attributes to select on without the tab knowing anything about its
 * container.
 *
 * The host is the `tab` itself rather than a wrapper around a button, so it is
 * the element the group focuses and the one `aria-controls` points from.
 *
 * @slot - the tab's label.
 * @part label - the label's box.
 * @part icon - the decorative icon, when `icon` is set.
 * @part count - the count badge, when `count` is set.
 */
@Component({
  tag: 'pf-tab',
  styleUrl: 'pf-tab.css',
  shadow: true,
})
export class PfTab {
  @Element() el!: HTMLElement;

  /**
   * Identifies the tab, and pairs it with the `pf-tab-panel` carrying the same
   * value.
   *
   * Reflected because the generated bindings set props as *properties*: an
   * unreflected prop leaves no attribute, and anything selecting on one — a
   * consumer's stylesheet, or a test — finds nothing.
   */
  @Prop({ reflect: true }) value = '';

  /** Reflected; the stylesheet and the group's own filtering both read it. */
  @Prop({ reflect: true }) disabled = false;

  /** Set by the group. Reflected, so the stylesheet can mark the tab. */
  @Prop({ mutable: true, reflect: true }) selected = false;

  /** Set by the group from its own `variant`. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) variant: PfTabsVariant = 'underline';

  /** Set by the group from its own `size`. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) size: PfTabsSize = 'md';

  /** Set by the group from its own `fullWidth`. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) fullWidth = false;

  /** A decorative icon's name, from the same registry as `pf-icon`. */
  @Prop() icon?: string;

  /** Which side of the label the icon sits on. */
  @Prop() iconPlacement: PfTabPlacement = 'start';

  /**
   * A count rendered as a badge beside the label (GitHub-style, "Issues 12").
   * It is left in the tab's accessible name, so a screen reader announces it.
   * `0` shows a zero; omitting the prop shows no badge at all.
   */
  @Prop() count?: number;

  /** Which side of the label the count badge sits on. */
  @Prop() badgePlacement: PfTabPlacement = 'end';

  /** Asks the group to select this tab. The group decides. */
  @Event() pfTabSelect!: EventEmitter<{ value: string }>;

  /**
   * Puts itself in the group's `tab` slot.
   *
   * So that a consumer can write one `pf-tab` and one `pf-tab-panel` per item
   * — interleaved, which is what a loop over data produces — and still have
   * the tabs land in the strip and the panels in the stack below it. A slot
   * the consumer set themselves is left alone, so the explicit spelling keeps
   * working.
   *
   * Assigning `slot` moves the node between slots, which fires `slotchange` on
   * both; writing the same value again is not a mutation, so this does not
   * loop.
   */
  connectedCallback() {
    if (!this.el.hasAttribute('slot')) this.el.setAttribute('slot', 'tab');
  }

  @Listen('click')
  handleClick(event: MouseEvent) {
    if (this.disabled) {
      // Swallowed rather than left for the group to read as a selection.
      event.stopPropagation();
      return;
    }
    this.pfTabSelect.emit({ value: this.value });
  }

  /**
   * Enter and Space select, as they do on a tab. The arrows are the group's:
   * only it knows the other tabs.
   *
   * `preventDefault` because the host is a focusable element rather than a
   * button, so Space would scroll the page instead.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!isActivationKey(event.key) || this.disabled) return;
    event.preventDefault();
    this.pfTabSelect.emit({ value: this.value });
  }

  render() {
    const icon = this.icon ? (
      <pf-icon key="icon" class="icon" part="icon" name={this.icon} aria-hidden="true"></pf-icon>
    ) : null;
    const count =
      this.count === undefined ? null : (
        <pf-badge key="count" class="count" part="count" variant="neutral">
          {this.count}
        </pf-badge>
      );

    return (
      <Host
        role="tab"
        aria-selected={this.selected ? 'true' : 'false'}
        aria-disabled={this.disabled ? 'true' : null}
      >
        {this.iconPlacement === 'start' ? icon : null}
        {this.badgePlacement === 'start' ? count : null}
        <span class="label" part="label">
          <slot />
        </span>
        {this.badgePlacement === 'end' ? count : null}
        {this.iconPlacement === 'end' ? icon : null}
      </Host>
    );
  }
}
