import { clampPage, getPaginationItems } from '@pitchfork-ui/core';
import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

/**
 * A pager: boundary pages pinned at each end, a window around the current
 * page, and an ellipsis wherever that leaves a gap.
 *
 * Controlled or not, like `pf-input`: `page` is mutable, so leaving it alone
 * lets the element advance itself, and setting it on every `pfPageChange`
 * keeps the consumer in charge.
 *
 * @slot previous - the previous button's label. Defaults to "Previous".
 * @slot next - the next button's label. Defaults to "Next".
 * @part nav - either of the previous/next buttons.
 * @part previous - the previous button.
 * @part next - the next button.
 * @part list - the ordered list of pages.
 * @part page - each page button.
 * @part current - the page button for the current page.
 * @part ellipsis - each gap.
 */
@Component({
  tag: 'pf-pagination',
  styleUrl: 'pf-pagination.css',
  shadow: true,
})
export class PfPagination {
  /** The current page, 1-based. Mutable so the element can advance itself. */
  @Prop({ mutable: true }) page = 1;

  /** How many pages there are in total. */
  @Prop() totalPages = 1;

  /** Pages to show either side of the current one. */
  @Prop() siblingCount = 1;

  /** Pages to pin at each end. */
  @Prop() boundaryCount = 1;

  /** Show the previous/next buttons. Reflected for the stylesheet. */
  @Prop({ reflect: true }) showPrevNext = true;

  /** Disable every button. Reflected for the stylesheet. */
  @Prop({ reflect: true }) disabled = false;

  /** Accessible name for the navigation landmark. */
  @Prop() label = 'Pagination';

  /** Emitted with the page the user asked for, already clamped to the range. */
  @Event() pfPageChange!: EventEmitter<{ page: number }>;

  private goTo(next: number) {
    if (this.disabled) return;

    const clamped = clampPage(next, Math.max(this.totalPages, 1));
    if (clamped === this.page) return;

    this.page = clamped;
    this.pfPageChange.emit({ page: clamped });
  }

  render() {
    const total = Math.max(this.totalPages, 1);
    // Both layers go through core, so the same inputs offer the same pages.
    const current = clampPage(this.page, total);
    const items = getPaginationItems(current, total, this.siblingCount, this.boundaryCount);

    return (
      <Host role="navigation" aria-label={this.label}>
        {this.showPrevNext && (
          <button
            class="nav"
            part="nav previous"
            type="button"
            disabled={this.disabled || current <= 1}
            onClick={() => this.goTo(current - 1)}
          >
            {/*
              Slot fallback is the web-component answer to React's
              `prevLabel = 'Previous'` default: the consumer overrides it by
              slotting something, and gets the text if they do not.
            */}
            <slot name="previous">Previous</slot>
          </button>
        )}

        <ol class="list" part="list">
          {items.map((item, index) =>
            typeof item === 'number' ? (
              <li key={item}>
                <button
                  class={{ page: true, 'page--active': item === current }}
                  part={item === current ? 'page current' : 'page'}
                  type="button"
                  disabled={this.disabled}
                  aria-current={item === current ? 'page' : null}
                  onClick={() => this.goTo(item)}
                >
                  {item}
                </button>
              </li>
            ) : (
              // The gap is decorative: a screen reader walking the list gets
              // the page numbers, and "..." would only interrupt them.
              <li key={`${item}-${index}`} class="ellipsis" part="ellipsis" aria-hidden="true">
                ...
              </li>
            ),
          )}
        </ol>

        {this.showPrevNext && (
          <button
            class="nav"
            part="nav next"
            type="button"
            disabled={this.disabled || current >= total}
            onClick={() => this.goTo(current + 1)}
          >
            <slot name="next">Next</slot>
          </button>
        )}
      </Host>
    );
  }
}
