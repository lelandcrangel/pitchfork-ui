import { Component, Element, Event, EventEmitter, h, Host, State } from '@stencil/core';

/**
 * A titled group of `pf-nav-item` children inside a `pf-sidebar-navigation`.
 *
 * The React `SidebarNavigation` takes a `sections` array of `{ title, items }`.
 * Grouping slotted children has to be structural — one `<slot>` renders every
 * assigned child in source order, and a shadow root cannot wrap a subset of
 * them in a box — so the consumer nests, which is the §2.1 idiom and the same
 * answer `pf-command-group` gives.
 *
 * The title names the list with a **same-root** IDREF: both the title and the
 * `<ul>` are in this shadow root, so the reference resolves. An
 * `aria-labelledby` from the host could not point at either of them.
 *
 * @slot - the `pf-nav-item` children.
 * @slot title - the section's title.
 * @part title - the title's box.
 * @part list - the list the items are slotted into.
 */
@Component({
  tag: 'pf-nav-section',
  styleUrl: 'pf-nav-section.css',
  shadow: true,
})
export class PfNavSection {
  @Element() el!: HTMLElement;

  /**
   * Whether anything was slotted into `title`.
   *
   * Asked in JS because the box carries padding and a size of its own, and
   * because an `aria-labelledby` pointing at an empty element names the list
   * with an empty string rather than falling back to nothing.
   */
  @State() hasTitle = false;

  /**
   * Tells the navigation its items have moved.
   *
   * `slotchange` is not composed, so the navigation never hears this
   * section's own slot change — exactly the reason `pf-tree-item` emits
   * `pfTreeStructure`. Without it an item appended to a section is never
   * given an orientation or a place in the one-current resolution.
   */
  @Event() pfNavStructure!: EventEmitter<void>;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.readTitle();
  }

  private readTitle() {
    /*
     * `el.children` rather than a `:scope >` selector, which Stencil's mock
     * DOM throws on.
     */
    this.hasTitle = Array.from(this.el.children).some(
      (child) => child.getAttribute('slot') === 'title',
    );
  }

  private handleSlotChange() {
    this.readTitle();
    this.pfNavStructure.emit();
  }

  render() {
    return (
      <Host>
        {/*
          The slot stays in the tree whether or not it holds anything: a slot
          that is not rendered never fires `slotchange`, so a title added
          later would stay invisible for good.
        */}
        <p class={{ title: true, empty: !this.hasTitle }} part="title" id="title">
          <slot name="title" onSlotchange={() => this.handleSlotChange()} />
        </p>

        <ul class="list" part="list" aria-labelledby={this.hasTitle ? 'title' : null}>
          <slot onSlotchange={() => this.handleSlotChange()} />
        </ul>
      </Host>
    );
  }
}
