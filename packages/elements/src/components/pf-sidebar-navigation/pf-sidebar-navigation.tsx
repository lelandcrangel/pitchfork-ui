import { resolveCurrentNavItem } from '@pitchfork-ui/core';
import { Component, Element, h, Host, Listen, Method, Prop, State } from '@stencil/core';

/**
 * A sidebar navigation over `pf-nav-item` children, optionally grouped into
 * `pf-nav-section`s.
 *
 * The group owns the one thing an item cannot know: which item is the current
 * page. Core's rule decides, so the React `SidebarNavigation` marks the same
 * one — and the resolution runs across every section rather than within one,
 * because `aria-current="page"` names the one page the reader is on and a
 * sidebar with two marked sections would claim two.
 *
 * As with `pf-header-navigation`, the host is not a landmark of its own: the
 * React component renders an `<aside>`, and an element cannot know whether it
 * is the page's complementary region. Only the `<nav>` is rendered.
 *
 * Items are grouped: the default slot takes `pf-nav-section` children, each
 * of which owns its own `<ul>`. A navigation with no section titles is one
 * untitled section, which is exactly what the React `sections` array is — and
 * it is also the only arrangement that keeps the list semantics honest, since
 * a `<ul>` here would be a list whose children were sections rather than
 * items.
 *
 * @slot - the `pf-nav-section` children.
 * @slot header - a box above the navigation, such as a product switcher.
 * @slot footer - a box below it, pushed to the bottom.
 * @part header - the header's box.
 * @part nav - the navigation landmark.
 * @part footer - the footer's box.
 */
@Component({
  tag: 'pf-sidebar-navigation',
  styleUrl: 'pf-sidebar-navigation.css',
  shadow: true,
})
export class PfSidebarNavigation {
  @Element() el!: HTMLElement;

  /** The navigation's accessible name. */
  @Prop() label = 'Sidebar navigation';

  /**
   * Whether anything was slotted into `header` and `footer`.
   *
   * Asked in JS: both boxes carry a border and padding, so an empty one draws
   * a rule across the sidebar for no reason, and a wrapper around a slot
   * cannot be collapsed from CSS. The same arrangement as
   * `pf-slideout-menu`'s footer.
   */
  @State() hasHeader = false;
  @State() hasFooter = false;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  /**
   * A section's own slot changed, so the items below it have moved.
   *
   * `slotchange` is not composed, so this is the only way the navigation
   * hears about an item appended inside a section. The event comes from a
   * slotted child in the navigation's own tree, so `event.target` is the
   * section rather than the host — nothing is retargeted, which is what makes
   * a host listener safe here and not on a child in the shadow root.
   */
  @Listen('pfNavStructure')
  handleStructureChange(event: CustomEvent<void>) {
    event.stopPropagation();
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

  /**
   * Every item this navigation owns, in document order, however deeply a
   * section nests it — but not one belonging to a navigation nested inside
   * this one.
   */
  private get items(): HTMLElement[] {
    /*
     * The walk up is written out rather than done with `closest`, which would
     * need a comma selector the mock DOM may not take. The first navigation
     * above an item is the one that owns it, so a navigation nested inside
     * this one keeps its own.
     */
    const ownedByThis = (item: HTMLElement) => {
      for (let node = item.parentElement; node; node = node.parentElement) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'pf-sidebar-navigation' || tag === 'pf-header-navigation') {
          return node === this.el;
        }
      }
      return false;
    };

    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-nav-item')).filter(ownedByThis);
  }

  /**
   * The property if the item has upgraded, the attribute if it has not:
   * `componentWillLoad` can run before a child parsed from HTML upgrades.
   */
  private isCurrent(item: HTMLElement) {
    return (item as HTMLElement & { current?: boolean }).current ?? item.hasAttribute('current');
  }

  private sync() {
    const slotted = (name: string) =>
      Array.from(this.el.children).some((child) => child.getAttribute('slot') === name);

    this.hasHeader = slotted('header');
    this.hasFooter = slotted('footer');

    const items = this.items;
    const currentIndex = resolveCurrentNavItem(
      items.map((item) => ({ current: this.isCurrent(item) })),
    );

    for (const [index, item] of items.entries()) {
      const node = item as HTMLElement & { currentPage: boolean; orientation: string };
      node.currentPage = index === currentIndex;
      node.orientation = 'vertical';
    }
  }

  render() {
    return (
      <Host>
        <div class={{ header: true, empty: !this.hasHeader }} part="header">
          <slot name="header" onSlotchange={() => this.refresh()} />
        </div>

        <nav class="nav" part="nav" aria-label={this.label}>
          <slot onSlotchange={() => this.refresh()} />
        </nav>

        <div class={{ footer: true, empty: !this.hasFooter }} part="footer">
          <slot name="footer" onSlotchange={() => this.refresh()} />
        </div>
      </Host>
    );
  }
}
