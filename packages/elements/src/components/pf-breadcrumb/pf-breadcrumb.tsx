import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One crumb in a `pf-breadcrumbs` trail.
 *
 * With an `href` it renders a link; without one it renders a plain span, which
 * is both what a current page wants and the way to use a framework's own
 * router — slot an `<a routerLink>` or a `<Link>` in and leave `href` unset.
 *
 * `currentPage`, `last` and `separator` are the group's to set: only it can
 * see the trail. A consumer asks by setting `current`; the group resolves the
 * trail with core's rule and writes the answer to `currentPage`.
 *
 * @slot - the crumb's label.
 * @part link - the link, or the span standing in for one.
 * @part separator - the separator after this crumb. Absent on the last.
 */
@Component({
  tag: 'pf-breadcrumb',
  styleUrl: 'pf-breadcrumb.css',
  shadow: true,
})
export class PfBreadcrumb {
  /** Where the crumb goes. Reflected; a consumer's stylesheet reads it. */
  @Prop({ reflect: true }) href?: string;

  /**
   * Set it to mark this crumb as the current page, rather than letting the
   * last crumb be it.
   *
   * This is the *asking* half, and the group never writes it — `currentPage`
   * below is the answer. Keeping the two apart is what lets the trail change:
   * if the group wrote its answer back here, the crumb that happened to be
   * last would look like a crumb the consumer had marked, and appending
   * another would leave the mark behind on it.
   */
  @Prop({ reflect: true }) current = false;

  /**
   * Set by the group: the resolved current page, which is the one thing that
   * renders `aria-current="page"`. Exactly one crumb in a trail carries it.
   */
  @Prop({ mutable: true, reflect: true }) currentPage = false;

  /** Set by the group: no separator is drawn after the last crumb. */
  @Prop({ mutable: true, reflect: true }) last = false;

  /** Set by the group from its own `separator`. */
  @Prop({ mutable: true }) separator = '/';

  render() {
    const label = <slot />;

    return (
      <Host role="listitem">
        {this.href ? (
          <a
            class="link"
            part="link"
            href={this.href}
            aria-current={this.currentPage ? 'page' : null}
          >
            {label}
          </a>
        ) : (
          <span class="link" part="link" aria-current={this.currentPage ? 'page' : null}>
            {label}
          </span>
        )}
        {!this.last && (
          <span class="separator" part="separator" aria-hidden="true">
            {this.separator}
          </span>
        )}
      </Host>
    );
  }
}
