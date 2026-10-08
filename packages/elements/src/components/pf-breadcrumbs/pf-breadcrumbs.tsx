import { resolveCurrentCrumb } from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, Watch } from '@stencil/core';

/**
 * A breadcrumb trail over `pf-breadcrumb` children.
 *
 * The group owns the two things a crumb cannot know on its own: which crumb is
 * the current page, and which one is last — so only the last goes without a
 * separator after it.
 *
 * The separator is a **string**, where the React `separator` is a
 * `ReactNode`, because it has to appear between every pair: a slot renders its
 * assigned content once and in one place, so there is no way to repeat
 * slotted content down the trail. Each crumb draws its own instead, which is
 * why the group pushes the string down.
 *
 * @slot - the `pf-breadcrumb` children.
 * @part list - the ordered list the crumbs are slotted into.
 */
@Component({
  tag: 'pf-breadcrumbs',
  styleUrl: 'pf-breadcrumbs.css',
  shadow: true,
})
export class PfBreadcrumbs {
  @Element() el!: HTMLElement;

  /** The trail's accessible name. */
  @Prop() label = 'Breadcrumb';

  /** Drawn after every crumb but the last. */
  @Prop() separator = '/';

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Watch('separator')
  handleSeparatorChange() {
    this.sync();
  }

  /**
   * Re-reads the children, for a consumer who marked a crumb current through
   * its *property* — which leaves no attribute and fires no `slotchange`.
   */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested trail owns its own crumbs. */
  private get crumbs(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-breadcrumb')).filter(
      (crumb) => crumb.parentElement === this.el,
    );
  }

  /**
   * The property if the crumb has upgraded, the attribute if it has not:
   * `componentWillLoad` can run before a child parsed from HTML upgrades.
   */
  private isCurrent(crumb: HTMLElement) {
    return (crumb as HTMLElement & { current?: boolean }).current ?? crumb.hasAttribute('current');
  }

  /**
   * Core's rule for which crumb is current — the first one marked, or the last
   * — so the React `Breadcrumbs` marks the same one. One index, which is what
   * stops a trail claiming two current pages.
   *
   * The answer goes to `currentPage`, never to the `current` the consumer
   * asked with. Writing it back to `current` looked tidier and was wrong:
   * with nothing marked, the last crumb was given `current`, and appending
   * another crumb then found that one marked and left the mark behind on it.
   * A browser test appends a crumb, which is what caught it.
   */
  private sync() {
    const crumbs = this.crumbs;
    const currentIndex = resolveCurrentCrumb(
      crumbs.map((crumb) => ({ current: this.isCurrent(crumb) })),
    );

    for (const [index, crumb] of crumbs.entries()) {
      const node = crumb as HTMLElement & {
        currentPage: boolean;
        last: boolean;
        separator: string;
      };
      node.currentPage = index === currentIndex;
      node.last = index === crumbs.length - 1;
      node.separator = this.separator;
    }
  }

  render() {
    return (
      <Host role="navigation" aria-label={this.label}>
        <ol class="list" part="list">
          <slot onSlotchange={() => this.refresh()} />
        </ol>
      </Host>
    );
  }
}
