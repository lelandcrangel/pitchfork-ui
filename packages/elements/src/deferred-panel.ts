/**
 * A popover panel whose content is built the first time it opens.
 *
 * A closed picker used to render its whole panel at load: a month of day
 * buttons in `pf-date-picker`, two months in `pf-date-range-picker`, and an
 * hour and a minute column in `pf-time-picker`. Measured in Chromium, a closed
 * `pf-date-picker` was 192 DOM nodes, `pf-date-range-picker` 136 and
 * `pf-time-picker` 94; each is 8 now, so a form of eight date fields no
 * longer builds 1,500 nodes nobody has asked to see.
 *
 * The panel element itself still renders at load, because it is the popover
 * the browser opens and the box `aria-controls` can name. Only its content
 * waits. Once built it stays, so a second open keeps the month the reader
 * left it on, as before.
 *
 * Opening has to wait for that first render: `@Watch('open')` runs before
 * it, so the content does not exist yet, and showing an empty popover would
 * position it at the wrong size and focus nothing. So the first open marks
 * the content to be built and shows it from `componentDidRender`; every later
 * open shows at once.
 */
export class DeferredPanel {
  private pending = false;

  /**
   * @param host the component, whose `panelBuilt` is a `@State` so that
   *   setting it renders the content
   * @param show positions and shows the popover, and moves focus into it
   */
  constructor(
    private readonly host: { panelBuilt: boolean },
    private readonly show: () => void,
  ) {}

  /** Shows the panel, building its content first if it has none yet. */
  open() {
    if (this.host.panelBuilt) {
      this.show();
      return;
    }
    this.pending = true;
    this.host.panelBuilt = true;
  }

  /** Forgets an open that has not happened yet. */
  close() {
    this.pending = false;
  }

  /** Call from `componentDidRender`: finishes an open that waited for the content. */
  rendered(stillOpen: boolean) {
    if (!this.pending) return;
    this.pending = false;
    if (stillOpen) this.show();
  }
}
