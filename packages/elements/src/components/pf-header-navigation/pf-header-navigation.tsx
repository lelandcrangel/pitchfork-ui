import { resolveCurrentNavItem } from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, State } from '@stencil/core';

/**
 * A header navigation over `pf-nav-item` children.
 *
 * The group owns the one thing an item cannot know: which item is the current
 * page. Core's rule decides, so the React `HeaderNavigation` marks the same
 * one, and it is one index — which is what stops a navigation claiming two
 * current pages.
 *
 * The host is **not** a banner. The React component renders a `<header>`,
 * which is the banner landmark at the top level of a page, but an element
 * cannot know whether it is the page's header: a second banner is a defect,
 * not a decoration. So the shadow root renders only the `<nav>` landmark, and
 * a consumer who wants a banner puts this inside their own `<header>`.
 *
 * @slot - the `pf-nav-item` children.
 * @slot brand - a logo or product name, before the items.
 * @slot actions - controls after the items, such as a sign-in button.
 * @part nav - the navigation landmark.
 * @part brand - the brand's box.
 * @part list - the list the items are slotted into.
 * @part actions - the actions' box.
 */
@Component({
  tag: 'pf-header-navigation',
  styleUrl: 'pf-header-navigation.css',
  shadow: true,
})
export class PfHeaderNavigation {
  @Element() el!: HTMLElement;

  /** The navigation's accessible name. */
  @Prop() label = 'Header navigation';

  /**
   * Whether anything was slotted into `brand` and `actions`.
   *
   * Asked in JS because a wrapper around a slot cannot be collapsed from CSS
   * — `:not(:has(*))` never matches, since the `<slot>` is itself a child —
   * and these two boxes have to exist when they are used: they are grid
   * items, so an empty one still takes a column and a gap, which would push
   * every item along by one `--space-3` for no visible reason.
   */
  @State() hasBrand = false;
  @State() hasActions = false;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  /**
   * Re-reads the items, for a consumer who marked one current through its
   * *property* — which leaves no attribute and fires no `slotchange`.
   */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested navigation owns its own items. */
  private get items(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-nav-item')).filter(
      (item) => item.parentElement === this.el,
    );
  }

  /**
   * The property if the item has upgraded, the attribute if it has not:
   * `componentWillLoad` can run before a child parsed from HTML upgrades.
   */
  private isCurrent(item: HTMLElement) {
    return (item as HTMLElement & { current?: boolean }).current ?? item.hasAttribute('current');
  }

  private sync() {
    /*
     * The children are read one by one rather than with a `:scope >`
     * selector, which Stencil's mock DOM does not support at all — it throws
     * from jQuery's selector engine rather than returning nothing.
     */
    const slotted = (name: string) =>
      Array.from(this.el.children).some((child) => child.getAttribute('slot') === name);

    this.hasBrand = slotted('brand');
    this.hasActions = slotted('actions');

    const items = this.items;
    const currentIndex = resolveCurrentNavItem(
      items.map((item) => ({ current: this.isCurrent(item) })),
    );

    for (const [index, item] of items.entries()) {
      const node = item as HTMLElement & { currentPage: boolean; orientation: string };
      node.currentPage = index === currentIndex;
      node.orientation = 'horizontal';
    }
  }

  render() {
    return (
      <Host>
        <nav class="nav" part="nav" aria-label={this.label}>
          {/*
            The slots stay in the tree whether or not they hold anything: a
            slot that is not rendered never fires `slotchange`, so content
            added later would stay invisible for good. The box is hidden
            instead.
          */}
          <span class={{ brand: true, empty: !this.hasBrand }} part="brand">
            <slot name="brand" onSlotchange={() => this.refresh()} />
          </span>

          <ul class="list" part="list">
            <slot onSlotchange={() => this.refresh()} />
          </ul>

          <span class={{ actions: true, empty: !this.hasActions }} part="actions">
            <slot name="actions" onSlotchange={() => this.refresh()} />
          </span>
        </nav>
      </Host>
    );
  }
}
