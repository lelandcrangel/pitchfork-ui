import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One panel inside a `pf-tabs`, shown when the `pf-tab` carrying the same
 * `value` is selected.
 *
 * A sibling of its tab rather than a child of it, so that both live in the
 * consumer's tree: that is what lets the group point `aria-controls` at this
 * panel and `aria-labelledby` back at the tab, since a same-root IDREF is the
 * one that resolves.
 *
 * @slot - the panel's content.
 */
@Component({
  tag: 'pf-tab-panel',
  styleUrl: 'pf-tab-panel.css',
  shadow: true,
})
export class PfTabPanel {
  /**
   * Pairs the panel with its tab.
   *
   * Reflected because the generated bindings set props as properties, so
   * without it a consumer selecting `pf-tab-panel[value="..."]` in a React or
   * Angular app finds nothing. The group reads the property.
   */
  @Prop({ reflect: true }) value = '';

  /** Set by the group: whether this is the panel on show. Reflected. */
  @Prop({ mutable: true, reflect: true }) active = false;

  render() {
    return (
      <Host
        role="tabpanel"
        /*
         * `hidden` as well as the reflected `active`, because it hides the
         * panel through the UA stylesheet — so a consumer who has not loaded
         * this package's CSS still sees one panel rather than all of them.
         *
         * `false` is safe here although `hidden="false"` would still hide the
         * element: Stencil writes an attribute it finds as a *property* on the
         * host, and `el.hidden = false` removes it. Measured both ways, in the
         * mock DOM and in Chromium.
         */
        hidden={!this.active}
        tabindex={this.active ? '0' : null}
      >
        <slot />
      </Host>
    );
  }
}
