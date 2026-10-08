import {
  clampPieCutout,
  pieConicGradient,
  preparePieSegments,
  roundPercentages,
} from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, State, Watch } from '@stencil/core';

/**
 * A pie or donut over `pf-pie-slice` children.
 *
 * The chart owns the two things a slice cannot know: its share of the total
 * and its colour. Both go to the slice, which draws its own legend row —
 * a slot renders its assigned content once and in one place, so a legend
 * built in the shadow root could never reach labels that live in the light
 * DOM.
 *
 * All of the arithmetic is core's, so this and the React `PieChart` show the
 * same breakdown, down to the legend's percentages summing to 100.
 *
 * @slot - the `pf-pie-slice` children.
 * @slot center - what goes in the hole.
 * @slot empty - what to show when nothing is drawable.
 * @part visual - the circle.
 * @part gradient - the layer the wedges are painted on.
 * @part center - the hole in the middle.
 * @part legend - the list the slices are slotted into.
 */
@Component({
  tag: 'pf-pie-chart',
  styleUrl: 'pf-pie-chart.css',
  shadow: true,
})
export class PfPieChart {
  @Element() el!: HTMLElement;

  /** Diameter, in pixels. Never below 120, where the ring stops reading. */
  @Prop() size = 192;

  /** The hole in the middle, as a fraction of the diameter. */
  @Prop() cutout = 0.58;

  /** Show the legend the slices make up. Reflected. */
  @Prop({ reflect: true }) showLegend = true;

  /** The chart's accessible name. */
  @Prop() label = 'Pie chart';

  /** The gradient painting the wedges, which only the chart can work out. */
  @State() gradient = 'conic-gradient(var(--pf-piechart-empty) 0% 100%)';

  /** Whether anything is drawable, which decides between chart and empty state. */
  @State() hasData = false;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  /**
   * Re-reads the slices, for a consumer who changed a value through its
   * *property* — which leaves no attribute and fires no `slotchange`.
   */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested chart owns its own slices. */
  private get slices(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-pie-slice')).filter(
      (slice) => slice.parentElement === this.el,
    );
  }

  /**
   * The property if the slice has upgraded, the attribute if it has not:
   * `componentWillLoad` can run before a child parsed from HTML upgrades.
   */
  private read(slice: HTMLElement) {
    const node = slice as HTMLElement & { value?: number; color?: string };
    const value = node.value ?? Number(slice.getAttribute('value'));
    return {
      value: Number(value),
      color: node.color ?? slice.getAttribute('color') ?? undefined,
    };
  }

  @Watch('cutout')
  sync() {
    const slices = this.slices;
    const segments = preparePieSegments(slices.map((slice) => this.read(slice)));
    const shares = roundPercentages(segments.map((segment) => segment.percentage));

    this.hasData = segments.length > 0;
    this.gradient = this.hasData
      ? pieConicGradient(segments)
      : 'conic-gradient(var(--pf-piechart-empty) 0% 100%)';

    /*
     * `index` is the slice's place in the original children, which is what
     * carries the answer back to the right slice: `preparePieSegments` drops
     * the ones that are not drawable, so its own positions no longer line up
     * with the children.
     */
    const bySlice = new Map(segments.map((segment, position) => [segment.index, position]));

    for (const [index, slice] of slices.entries()) {
      const position = bySlice.get(index);
      const node = slice as HTMLElement & { swatch: string; share: number; drawn: boolean };

      node.drawn = position !== undefined;
      node.swatch = position === undefined ? '' : segments[position].color;
      node.share = position === undefined ? 0 : shares[position];
    }
  }

  render() {
    const size = Math.max(Number(this.size) || 192, 120);
    const centerSize = Math.round(size * clampPieCutout(Number(this.cutout)));

    return (
      <Host>
        <div
          class={{ visual: true, 'visual--empty': !this.hasData }}
          part="visual"
          role="img"
          aria-label={this.label}
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          {/*
            The gradient goes on a real child rather than a `::before`, so a
            contrast checker can see the centre label against it.
          */}
          <div
            class="gradient"
            part="gradient"
            aria-hidden="true"
            style={{ '--pf-pie-gradient': this.gradient }}
          ></div>
          <div
            class="center"
            part="center"
            style={{ width: `${centerSize}px`, height: `${centerSize}px` }}
          >
            {this.hasData ? <slot name="center" /> : <slot name="empty">No data</slot>}
          </div>
        </div>

        {/*
          The list stays in the tree whether or not the legend is shown: a
          slot that is not rendered never fires `slotchange`, so slices added
          later would stay invisible for good — and the slices have to be
          read even when the legend is hidden, because they are the data.
        */}
        <ul class={{ legend: true, 'legend--hidden': !this.showLegend }} part="legend">
          <slot onSlotchange={() => this.refresh()} />
        </ul>
      </Host>
    );
  }
}
