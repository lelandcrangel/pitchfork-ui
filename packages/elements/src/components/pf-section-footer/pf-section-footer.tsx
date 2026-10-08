import { Component, Element, h, Host, Prop, State } from '@stencil/core';

import type { PfSectionHeaderAlign } from '../pf-section-header/pf-section-header';

/**
 * The foot of a section: an optional heading and line of text, and the
 * controls that close it off.
 *
 * The same shape as `pf-section-header` with the rule on the other edge —
 * and, unlike the header, the heading is optional here, so its box is one of
 * the ones that can be empty.
 *
 * @slot - the heading.
 * @slot description - a line below the heading.
 * @slot actions - controls, which sit opposite the heading on a wide screen.
 * @part content - the box holding the heading and the description.
 * @part heading - the heading's box.
 * @part actions - the box holding the actions slot.
 */
@Component({
  tag: 'pf-section-footer',
  styleUrl: 'pf-section-footer.css',
  shadow: true,
})
export class PfSectionFooter {
  @Element() el!: HTMLElement;

  /** Draw a rule above the footer. Defaults to true, as the React one does. */
  @Prop({ reflect: true }) divider = true;

  /** How the heading and the actions share the row. Reflected. */
  @Prop({ reflect: true }) align: PfSectionHeaderAlign = 'between';

  /** Which of the boxes that carry layout have anything in them. */
  @State() hasHeading = false;
  @State() hasActions = false;

  /** Read from the light DOM, so first paint is right without `slotchange`. */
  componentWillLoad() {
    this.read();
  }

  private read = () => {
    const children = Array.from(this.el.children);

    // The heading is the default slot, so it is anything *without* a slot name
    // — including a bare text node, which is why the text is counted too.
    this.hasHeading =
      children.some((child) => !child.hasAttribute('slot')) ||
      Array.from(this.el.childNodes).some(
        (node) => node.nodeType === 3 && (node.textContent ?? '').trim() !== '',
      );
    this.hasActions = children.some((child) => child.getAttribute('slot') === 'actions');
  };

  render() {
    return (
      <Host>
        <div class="content" part="content">
          <h3 class={{ heading: true, empty: !this.hasHeading }} part="heading">
            <slot onSlotchange={this.read} />
          </h3>
          <slot name="description" />
        </div>

        <div class={{ actions: true, empty: !this.hasActions }} part="actions">
          <slot name="actions" onSlotchange={this.read} />
        </div>
      </Host>
    );
  }
}
