import { Component, Element, h, Host, State } from '@stencil/core';

/**
 * The heading of a page: a breadcrumb trail, an eyebrow, the title, a line of
 * explanation, some metadata and the page's actions.
 *
 * The trail is slotted rather than taken as data — the consumer nests a
 * `pf-breadcrumbs` (WEB-COMPONENTS-PLAN.md §2.1), where the React
 * `PageHeader` takes a `breadcrumbs` array and renders the component itself.
 * Each crumb's label is a node, which does not cross the HTML boundary.
 *
 * @slot breadcrumbs - a `pf-breadcrumbs` trail above the title.
 * @slot eyebrow - small text above the title.
 * @slot - the title.
 * @slot description - a line below the title.
 * @slot metadata - small facts below the description.
 * @slot actions - the page's controls.
 * @part breadcrumbs - the box holding the breadcrumbs slot.
 * @part row - the row holding the content and the actions.
 * @part content - the box holding everything but the actions.
 * @part heading - the title's box.
 * @part metadata - the box holding the metadata slot.
 * @part actions - the box holding the actions slot.
 */
@Component({
  tag: 'pf-page-header',
  styleUrl: 'pf-page-header.css',
  shadow: true,
})
export class PfPageHeader {
  @Element() el!: HTMLElement;

  /** Which of the boxes that carry layout have anything in them. */
  @State() hasBreadcrumbs = false;
  @State() hasMetadata = false;
  @State() hasActions = false;

  /** Read from the light DOM, so first paint is right without `slotchange`. */
  componentWillLoad() {
    this.read();
  }

  private read = () => {
    const slotted = (name: string) =>
      Array.from(this.el.children).some((child) => child.getAttribute('slot') === name);

    this.hasBreadcrumbs = slotted('breadcrumbs');
    this.hasMetadata = slotted('metadata');
    this.hasActions = slotted('actions');
  };

  render() {
    return (
      <Host>
        {/*
          Hidden rather than left out, every one of them: a slot that is not
          rendered never fires `slotchange`, so a trail or an action added
          later would stay invisible for good.
        */}
        <div class={{ breadcrumbs: true, empty: !this.hasBreadcrumbs }} part="breadcrumbs">
          <slot name="breadcrumbs" onSlotchange={this.read} />
        </div>

        <div class="row" part="row">
          <div class="content" part="content">
            <slot name="eyebrow" />
            <h1 class="heading" part="heading">
              <slot />
            </h1>
            <slot name="description" />
            <div class={{ metadata: true, empty: !this.hasMetadata }} part="metadata">
              <slot name="metadata" onSlotchange={this.read} />
            </div>
          </div>

          <div class={{ actions: true, empty: !this.hasActions }} part="actions">
            <slot name="actions" onSlotchange={this.read} />
          </div>
        </div>
      </Host>
    );
  }
}
