import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One item in a `pf-header-navigation` or a `pf-sidebar-navigation`.
 *
 * Shared by both, because the React library's `HeaderNavigationItem` and
 * `SidebarNavigationItem` are the same shape — one element rather than two
 * that would drift. What differs is the layout, and that is the group's to
 * say: it pushes `orientation` down, which is the only thing an item cannot
 * work out for itself.
 *
 * With an `href` it renders a link; without one it renders a plain box, which
 * is how a framework's own router is used — slot an `<a routerLink>` or a
 * `<Link>` in and leave `href` unset.
 *
 * `currentPage` and `orientation` are the group's to set. A consumer asks by
 * setting `current`; the group resolves every item with core's rule and
 * writes the answer to `currentPage`.
 *
 * @slot - the item's label.
 * @slot icon - a leading icon.
 * @slot badge - a trailing badge or count.
 * @part link - the link, or the box standing in for one.
 */
@Component({
  tag: 'pf-nav-item',
  styleUrl: 'pf-nav-item.css',
  shadow: true,
})
export class PfNavItem {
  /** Where the item goes. Reflected; a consumer's stylesheet reads it. */
  @Prop({ reflect: true }) href?: string;

  /** Opens elsewhere, as on a plain anchor. Ignored without an `href`. */
  @Prop() target?: string;

  /** Goes on the anchor as-is. Ignored without an `href`. */
  @Prop() rel?: string;

  /**
   * Set it to mark this item as the current page.
   *
   * The *asking* half, which the group never writes — `currentPage` below is
   * the answer. The two are kept apart for the reason `pf-breadcrumb` keeps
   * them apart: a group that wrote its answer back would leave the mark
   * behind on an item the consumer had not marked.
   */
  @Prop({ reflect: true }) current = false;

  /**
   * Set by the group: the resolved current page, which is the one thing that
   * renders `aria-current="page"`. At most one item in a navigation carries
   * it, and the highlight follows it rather than `current` — a second
   * highlighted item with no `aria-current` would be a sighted-only lie.
   */
  @Prop({ mutable: true, reflect: true }) currentPage = false;

  /**
   * Takes the item out of the navigation without removing it.
   *
   * A disabled item renders **no anchor at all**, because an anchor has no
   * disabled state: `aria-disabled` alone leaves it focusable and clickable,
   * and dropping the `href` is the only thing that really takes it out of the
   * tab order.
   */
  @Prop({ reflect: true }) disabled = false;

  /** Set by the group, which is the only one that knows which it is. */
  @Prop({ mutable: true, reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  render() {
    const content = [
      <slot name="icon" />,
      <span class="label" part="label">
        <slot />
      </span>,
      <slot name="badge" />,
    ];

    return (
      <Host role="listitem">
        {this.href && !this.disabled ? (
          <a
            class="link"
            part="link"
            href={this.href}
            target={this.target}
            rel={this.rel}
            aria-current={this.currentPage ? 'page' : null}
          >
            {content}
          </a>
        ) : (
          <span
            class="link"
            part="link"
            aria-current={this.currentPage ? 'page' : null}
            aria-disabled={this.disabled ? 'true' : null}
          >
            {content}
          </span>
        )}
      </Host>
    );
  }
}
