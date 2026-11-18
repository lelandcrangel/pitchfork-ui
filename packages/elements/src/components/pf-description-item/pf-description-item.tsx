import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One term and its details, inside a `pf-description-list`.
 *
 * Renders a `<dt>` and a `<dd>`. The term is the `term` slot, or the `term`
 * attribute for plain text; the details are the default slot.
 *
 * @slot term - the term, when it needs markup.
 * @slot - the details.
 * @part term - the `<dt>`.
 * @part details - the `<dd>`.
 */
@Component({
  tag: 'pf-description-item',
  styleUrl: 'pf-description-item.css',
  shadow: true,
})
export class PfDescriptionItem {
  /** The term, as text. A `term` slot wins over it. */
  @Prop() term?: string;

  /** Set by the list. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Set by the list: draw a rule above this item. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) divided = false;

  render() {
    return (
      <Host>
        <dt class="term" part="term">
          <slot name="term">{this.term}</slot>
        </dt>
        <dd class="details" part="details">
          <slot />
        </dd>
      </Host>
    );
  }
}
