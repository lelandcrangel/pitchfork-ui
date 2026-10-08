import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

export type PfTableCellAlign = 'left' | 'center' | 'right';

/**
 * One cell of a `pf-table` row.
 *
 * A header cell carries `columnheader` rather than `cell`, which the row tells
 * it; `sortable` turns the label into a button that asks the table to sort.
 * The table answers by writing `sort` back, which is what `aria-sort` and the
 * indicator read — the ask and the answer kept apart, as everywhere else here.
 *
 * @slot - the cell's content.
 * @part sort - the header's sort button, when `sortable` is set.
 * @part indicator - the sort indicator inside that button.
 */
@Component({
  tag: 'pf-table-cell',
  styleUrl: 'pf-table-cell.css',
  shadow: true,
})
export class PfTableCell {
  /** Set by the row: a header cell. Reflected, so the stylesheet reads it. */
  @Prop({ mutable: true, reflect: true }) head = false;

  /** Set by the row: a cell in the last body row, which drops its rule. */
  @Prop({ mutable: true, reflect: true }) last = false;

  /** Which way the content sits. Reflected for the stylesheet. */
  @Prop({ reflect: true }) align: PfTableCellAlign = 'left';

  /** A column width, as any CSS length. Only a header cell's is read. */
  @Prop() width?: string;

  /**
   * Identifies the column in the table's sort state. A header cell with one
   * and `sortable` set is the only thing that can be sorted on.
   *
   * Reflected because the generated bindings set props as properties, so
   * without it a consumer selecting `pf-table-cell[sort-key="..."]` finds
   * nothing. The table reads the property.
   */
  @Prop({ reflect: true }) sortKey?: string;

  /** Offer to sort on this column. Reflected for the stylesheet. */
  @Prop({ reflect: true }) sortable = false;

  /** Set by the table: how this column is sorted, if it is. */
  @Prop({ mutable: true }) sort: 'ascending' | 'descending' | 'none' = 'none';

  /** Asks the table to sort on this column. The table decides which way. */
  @Event() pfTableSort!: EventEmitter<{ key: string }>;

  private onSort = () => {
    if (!this.sortKey) return;
    this.pfTableSort.emit({ key: this.sortKey });
  };

  render() {
    const sortable = this.head && this.sortable && Boolean(this.sortKey);

    return (
      <Host
        role={this.head ? 'columnheader' : 'cell'}
        aria-sort={sortable ? this.sort : null}
        style={this.width ? { width: this.width } : undefined}
      >
        {sortable ? (
          <button type="button" class="sort" part="sort" onClick={this.onSort}>
            <span class="label">
              <slot />
            </span>
            {/* Decorative: `aria-sort` on the header is what is announced. */}
            <span class="indicator" part="indicator" aria-hidden="true">
              {this.sort === 'ascending' ? '^' : this.sort === 'descending' ? 'v' : '-'}
            </span>
          </button>
        ) : (
          <slot />
        )}
      </Host>
    );
  }
}
