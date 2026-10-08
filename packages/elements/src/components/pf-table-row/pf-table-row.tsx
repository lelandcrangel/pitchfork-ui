import { Component, Element, h, Host, Prop, Watch } from '@stencil/core';

/**
 * One row of a `pf-table`.
 *
 * `display: table-row`, so the row is a box: that is what lets it take a
 * background for striping and a `:hover` of its own, neither of which an
 * element with `display: contents` can do. Its cells are table-cells inside
 * it, and the column widths come from the table layout rather than from
 * anything measured.
 *
 * The row pushes `head` and `last` onto its own cells, because it knows what
 * it is and they do not — `last` comes from the table, which is the only
 * thing that can see where the body ends.
 *
 * @slot - the `pf-table-cell` children.
 */
@Component({
  tag: 'pf-table-row',
  styleUrl: 'pf-table-row.css',
  shadow: true,
})
export class PfTableRow {
  @Element() el!: HTMLElement;

  /** A header row. Reflected, and pushed onto its cells. */
  @Prop({ reflect: true }) head = false;

  /** Set by the table: every other body row, for striping. Reflected. */
  @Prop({ mutable: true, reflect: true }) odd = false;

  /**
   * Set by the table: the last body row, whose cells drop their bottom border
   * so the rule does not double up with the table's own.
   */
  @Prop({ mutable: true, reflect: true }) last = false;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  @Watch('head')
  @Watch('last')
  sync() {
    for (const cell of Array.from(this.el.querySelectorAll<HTMLElement>('pf-table-cell'))) {
      if (cell.parentElement !== this.el) continue;
      const node = cell as HTMLElement & { head: boolean; last: boolean };
      node.head = this.head;
      node.last = this.last;
    }
  }

  render() {
    return (
      <Host role="row">
        <slot onSlotchange={() => this.sync()} />
      </Host>
    );
  }
}
