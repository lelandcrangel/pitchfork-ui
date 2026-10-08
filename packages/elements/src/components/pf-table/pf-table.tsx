import { ariaSortFor, nextSortState, type SortDirection, type SortState } from '@pitchfork-ui/core';
import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';

/**
 * A table over `pf-table-row` and `pf-table-cell` children.
 *
 * **It reports a sort rather than performing one.** The rows are the
 * consumer's — they wrote the loop — and reordering them would mean moving
 * elements in their DOM, which their framework would undo on its next render
 * and which would break its reconciliation on the way. So this element owns
 * the header buttons, `aria-sort` and the indicator, and emits `pfSortChange`
 * for the consumer to sort their own data with. `compareSortValues` and
 * `sortRowsBy` are in core precisely so that the order they produce matches
 * the React `Table`, which does sort for itself.
 *
 * The layout is CSS tables rather than a grid, which is what lets a row be a
 * box: a grid needs its rows to be `display: contents` for the cells to line
 * up in columns, and an element with no box takes no `:hover` and no
 * background — so striping and row hover would both have to be pushed down in
 * JS. `display: table-row` gives them for nothing, and column widths size
 * themselves.
 *
 * @slot caption - a heading above the table.
 * @slot - the `pf-table-row` children.
 * @slot empty - what to show when there are no body rows.
 * @part caption - the caption's box.
 * @part table - the table itself.
 * @part empty - the box holding the empty slot.
 */
@Component({
  tag: 'pf-table',
  styleUrl: 'pf-table.css',
  shadow: true,
})
export class PfTable {
  @Element() el!: HTMLElement;

  /** Tighter rows. Reflected, and bridged down to the cells' padding. */
  @Prop({ reflect: true }) dense = false;

  /** Shade every other body row. Reflected, and bridged down. */
  @Prop({ reflect: true }) striped = false;

  /** Shade the row under the pointer. Reflected, and bridged down. */
  @Prop({ reflect: true }) hoverable = true;

  /** Keep the header visible while the body scrolls. Reflected and bridged. */
  @Prop({ reflect: true }) stickyHeader = false;

  /** The column being sorted on, by its `sort-key`. */
  @Prop({ mutable: true, reflect: true }) sortKey?: string;

  /** Which way that column is sorted. */
  @Prop({ mutable: true, reflect: true }) sortDirection: SortDirection = 'asc';

  /** The table's accessible name, for a table whose caption is not enough. */
  @Prop() label?: string;

  /**
   * Fires when a header is clicked, with the sort the table has moved to.
   * Sorting the rows is the consumer's to do.
   */
  @Event() pfSortChange!: EventEmitter<SortState>;

  /** Whether there are any body rows, which decides the empty state. */
  @State() isEmpty = false;

  /**
   * Whether anything is slotted into the caption, which decides whether its
   * box is drawn. Asked in JS because a box around a slot cannot be collapsed
   * from CSS: `:has(slot)` always matches, since the slot is itself a child.
   */
  @State() hasCaption = false;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Watch('sortKey')
  @Watch('sortDirection')
  handleSortChange() {
    this.sync();
  }

  /** Re-reads the rows, for a consumer who changed one through a property. */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested table owns its own rows. */
  private get rows(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-table-row')).filter(
      (row) => row.parentElement === this.el,
    );
  }

  private isHead(row: HTMLElement) {
    return (row as HTMLElement & { head?: boolean }).head ?? row.hasAttribute('head');
  }

  private sync() {
    const rows = this.rows;
    const bodyRows = rows.filter((row) => !this.isHead(row));
    this.isEmpty = bodyRows.length === 0;

    this.hasCaption = Array.from(this.el.children).some(
      (child) => child.getAttribute('slot') === 'caption',
    );

    /*
     * Striping and the last row are the table's to work out: a row cannot
     * count its siblings without assuming where the header is, and the last
     * body row is the one whose cells drop their bottom border so the rule
     * does not double up with the table's own.
     */
    for (const [index, row] of bodyRows.entries()) {
      const node = row as HTMLElement & { odd: boolean; last: boolean };
      node.odd = index % 2 === 1;
      node.last = index === bodyRows.length - 1;
    }

    const current: SortState | undefined =
      this.sortKey === undefined ? undefined : { key: this.sortKey, direction: this.sortDirection };

    for (const row of rows.filter((candidate) => this.isHead(candidate))) {
      for (const cell of Array.from(row.querySelectorAll<HTMLElement>('pf-table-cell'))) {
        const node = cell as HTMLElement & { sort: 'ascending' | 'descending' | 'none' };
        const key = (cell as HTMLElement & { sortKey?: string }).sortKey;
        node.sort = key ? ariaSortFor(current, key) : 'none';
      }
    }
  }

  /**
   * A header asking to sort. The table decides which way — core's rule: a new
   * column starts ascending and the current one turns round — and reports it.
   */
  @Listen('pfTableSort')
  handleSort(event: CustomEvent<{ key: string }>) {
    event.stopPropagation();

    const current: SortState | undefined =
      this.sortKey === undefined ? undefined : { key: this.sortKey, direction: this.sortDirection };
    const next = nextSortState(current, event.detail.key);

    this.sortKey = next.key;
    this.sortDirection = next.direction;
    this.sync();
    this.pfSortChange.emit(next);
  }

  render() {
    return (
      <Host>
        <div class={{ caption: true, empty: !this.hasCaption }} part="caption">
          <slot name="caption" onSlotchange={() => this.refresh()} />
        </div>
        <div class="table" part="table" role="table" aria-label={this.label}>
          <slot onSlotchange={() => this.refresh()} />
          {/*
            `display: table-caption` with `caption-side: bottom`, which is the
            one box in a CSS table that spans every column — there is no
            `colspan` outside a real <table>. It stays inside the role="table"
            element, so a screen reader still finds it in the table.
          */}
          {this.isEmpty && (
            <div class="empty" part="empty" role="row">
              <span role="cell">
                <slot name="empty">No data available.</slot>
              </span>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
