import { Component, Element, h, Host, Prop, Watch } from '@stencil/core';

export type PfDescriptionListOrientation = 'horizontal' | 'vertical';

/**
 * Pairs of a term and its details: an order's summary, a record's fields, a
 * plan's limits.
 *
 * The list renders a real `<dl>` and each `pf-description-item` its own
 * `<dt>` and `<dd>`, so a screen reader announces terms and their
 * definitions. `horizontal` puts each term beside its details, with every
 * term in one column so the details line up down the page; `vertical`
 * stacks them, which is what a narrow container wants.
 *
 * @slot - the `pf-description-item` children.
 * @part list - the `<dl>`.
 */
@Component({
  tag: 'pf-description-list',
  styleUrl: 'pf-description-list.css',
  shadow: true,
})
export class PfDescriptionList {
  @Element() el!: HTMLElement;

  /** Terms beside their details, or above them. Reflected; pushed onto the items. */
  @Prop({ reflect: true }) orientation: PfDescriptionListOrientation = 'horizontal';

  /** Draw a rule between items. Reflected; pushed onto the items, which draw it. */
  @Prop({ reflect: true }) divided = false;

  componentDidLoad() {
    this.syncItems();
  }

  /**
   * The items read these for their own layout, as `pf-nav-item` does: a
   * rule between two slotted children cannot be drawn from here, since
   * `::slotted()` takes no combinator, and `:host-context()` is not in Firefox.
   */
  @Watch('orientation')
  @Watch('divided')
  syncItems() {
    for (const child of Array.from(this.el.children)) {
      if (child.localName === 'pf-description-item') {
        const item = child as HTMLElement & { orientation: string; divided: boolean };
        item.orientation = this.orientation;
        item.divided = this.divided;
      }
    }
  }

  render() {
    return (
      <Host>
        <dl class="list" part="list">
          <slot onSlotchange={() => this.syncItems()} />
        </dl>
      </Host>
    );
  }
}
