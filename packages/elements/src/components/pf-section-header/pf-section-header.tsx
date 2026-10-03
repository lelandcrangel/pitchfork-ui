import { Component, Element, h, Host, Prop, State } from '@stencil/core';

export type PfSectionHeaderAlign = 'start' | 'between' | 'end';

/**
 * The heading of a section, with room for an eyebrow, a line of explanation,
 * some metadata and a control or two.
 *
 * Every optional box stays in the tree and is hidden when empty rather than
 * being left out, because a slot that is not rendered never fires
 * `slotchange` — content added later would stay invisible for good. The
 * eyebrow and the description need no box of their own, so they are styled
 * through `::slotted()` and collapse on their own.
 *
 * @slot eyebrow - small text above the heading.
 * @slot - the heading.
 * @slot description - a line below the heading.
 * @slot metadata - small facts below the description.
 * @slot actions - controls, which sit opposite the heading on a wide screen.
 * @part content - the box holding everything but the actions.
 * @part heading - the heading's box.
 * @part metadata - the box holding the metadata slot.
 * @part actions - the box holding the actions slot.
 */
@Component({
  tag: 'pf-section-header',
  styleUrl: 'pf-section-header.css',
  shadow: true,
})
export class PfSectionHeader {
  @Element() el!: HTMLElement;

  /** Draw a rule below the header. Reflected for the stylesheet. */
  @Prop({ reflect: true }) divider = false;

  /** How the heading and the actions share the row. Reflected. */
  @Prop({ reflect: true }) align: PfSectionHeaderAlign = 'between';

  /** Which of the boxes that carry layout have anything in them. */
  @State() hasMetadata = false;
  @State() hasActions = false;

  /** Read from the light DOM, so first paint is right without `slotchange`. */
  componentWillLoad() {
    this.read();
  }

  private read = () => {
    const slotted = (name: string) =>
      Array.from(this.el.children).some((child) => child.getAttribute('slot') === name);

    this.hasMetadata = slotted('metadata');
    this.hasActions = slotted('actions');
  };

  render() {
    return (
      <Host>
        <div class="content" part="content">
          <slot name="eyebrow" />
          <h2 class="heading" part="heading">
            <slot />
          </h2>
          <slot name="description" />
          <div class={{ metadata: true, empty: !this.hasMetadata }} part="metadata">
            <slot name="metadata" onSlotchange={this.read} />
          </div>
        </div>

        <div class={{ actions: true, empty: !this.hasActions }} part="actions">
          <slot name="actions" onSlotchange={this.read} />
        </div>
      </Host>
    );
  }
}
