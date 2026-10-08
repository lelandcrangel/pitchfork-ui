import { resolveSlideIndex, slidePositionLabel } from '@pitchfork-ui/core';
import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';

/**
 * A carousel over `pf-carousel-slide` children.
 *
 * The group owns the index, the controls, the indicators and the live region
 * that announces the move; each slide owns only whether it is the one on show.
 *
 * `role="region"` with `aria-roledescription="carousel"` rather than any of
 * the tab or listbox patterns: a carousel is a region whose content changes,
 * and the announcement is what tells a reader it has.
 *
 * @slot - the `pf-carousel-slide` children.
 * @slot empty - what to show when there are no slides.
 * @part viewport - the clipping box.
 * @part track - the strip that slides.
 * @part controls - the row holding the buttons and the indicators.
 * @part previous - the step-back button.
 * @part next - the step-forward button.
 * @part indicators - the box holding the dots.
 * @part indicator - one dot.
 */
@Component({
  tag: 'pf-carousel',
  styleUrl: 'pf-carousel.css',
  shadow: true,
})
export class PfCarousel {
  @Element() el!: HTMLElement;

  /** The slide on show, counting from 0. */
  @Prop({ mutable: true }) index = 0;

  /** Wrap at both ends rather than stopping. */
  @Prop({ reflect: true }) loop = true;

  /** Show the dots. */
  @Prop({ reflect: true }) showIndicators = true;

  /** Step forward on a timer. */
  @Prop({ reflect: true }) autoPlay = false;

  /** How long between steps, in milliseconds. */
  @Prop() autoPlayInterval = 5000;

  /** The carousel's accessible name. */
  @Prop() label = 'Carousel';

  /** The step-back button's accessible name. */
  @Prop() previousLabel = 'Previous slide';

  /** The step-forward button's accessible name. */
  @Prop() nextLabel = 'Next slide';

  /** Fires when the slide on show changes, however it changed. */
  @Event() pfChange!: EventEmitter<{ index: number }>;

  /** How many slides there are, which every control depends on. */
  @State() total = 0;

  private timer?: number;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
    this.startTimer();
  }

  disconnectedCallback() {
    this.stopTimer();
  }

  @Watch('index')
  @Watch('loop')
  handleIndexChange() {
    this.sync();
  }

  @Watch('autoPlay')
  @Watch('autoPlayInterval')
  handleTimerChange() {
    this.startTimer();
  }

  /** Re-reads the slides, for a consumer who changed them imperatively. */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Steps one slide forward, as the button and the timer do. */
  @Method()
  async next() {
    this.goTo(this.resolved + 1);
  }

  /** Steps one slide back. */
  @Method()
  async previous() {
    this.goTo(this.resolved - 1);
  }

  /** Direct children only: a nested carousel owns its own slides. */
  private get slides(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-carousel-slide')).filter(
      (slide) => slide.parentElement === this.el,
    );
  }

  /** The slide actually on show, which an out-of-range index resolves to. */
  private get resolved(): number {
    return Math.max(resolveSlideIndex(this.index, this.total), 0);
  }

  private sync() {
    const slides = this.slides;
    this.total = slides.length;
    const active = this.resolved;

    for (const [position, slide] of slides.entries()) {
      const node = slide as HTMLElement & { active: boolean; position: number; total: number };
      node.active = position === active;
      node.position = position + 1;
      node.total = slides.length;
    }
  }

  private goTo(next: number) {
    const index = resolveSlideIndex(next, this.total, this.loop);
    if (index < 0 || index === this.resolved) return;

    this.index = index;
    this.sync();
    this.pfChange.emit({ index });
  }

  /**
   * One timer, restarted rather than stacked: a consumer changing the interval
   * while it runs would otherwise leave the old one going, and the carousel
   * would step twice as often for no visible reason.
   */
  private startTimer() {
    this.stopTimer();
    if (!this.autoPlay || this.total < 2) return;

    this.timer = window.setInterval(
      () => {
        this.goTo(this.resolved + 1);
      },
      Number(this.autoPlayInterval) || 5000,
    );
  }

  private stopTimer() {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }

  render() {
    const active = this.resolved;
    const atStart = !this.loop && active <= 0;
    const atEnd = !this.loop && active >= this.total - 1;

    return (
      <Host role="region" aria-roledescription="carousel" aria-label={this.label}>
        <div class="viewport" part="viewport">
          {this.total === 0 ? (
            <div class="empty" part="empty" role="status">
              <slot name="empty">Add at least one slide.</slot>
            </div>
          ) : null}
          {/*
            The track stays in the tree even with no slides, because a slot
            that is not rendered never fires `slotchange` — slides added later
            would stay invisible for good.
          */}
          <div
            class={{ track: true, empty: this.total === 0 }}
            part="track"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            <slot onSlotchange={() => this.refresh()} />
          </div>
        </div>

        {/*
          The announcement, which is the only thing a reader who cannot see the
          carousel has to go on. `aria-live` on a box that is always present:
          a live region added at the moment it changes is not announced.
        */}
        <span class="sr-only" aria-live="polite" aria-atomic="true">
          {this.total > 0 ? slidePositionLabel(active, this.total) : ''}
        </span>

        <div class="controls" part="controls">
          <button
            type="button"
            class="nav"
            part="previous"
            aria-label={this.previousLabel}
            disabled={atStart || this.total < 2}
            onClick={() => this.goTo(active - 1)}
          >
            <pf-icon name="square-caret-left" aria-hidden="true"></pf-icon>
          </button>

          {this.showIndicators && this.total > 1 ? (
            <div class="indicators" part="indicators" role="group" aria-label="Slide indicators">
              {Array.from({ length: this.total }, (_, position) => (
                <button
                  type="button"
                  class={{ indicator: true, 'indicator--active': position === active }}
                  part="indicator"
                  aria-label={`Go to slide ${position + 1}`}
                  aria-current={position === active ? 'true' : null}
                  onClick={() => this.goTo(position)}
                ></button>
              ))}
            </div>
          ) : (
            <span class="indicator-spacer" aria-hidden="true"></span>
          )}

          <button
            type="button"
            class="nav"
            part="next"
            aria-label={this.nextLabel}
            disabled={atEnd || this.total < 2}
            onClick={() => this.goTo(active + 1)}
          >
            <pf-icon name="square-caret-right" aria-hidden="true"></pf-icon>
          </button>
        </div>
      </Host>
    );
  }
}
