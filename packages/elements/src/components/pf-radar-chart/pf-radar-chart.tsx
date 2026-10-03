import {
  RADAR_MINIMUM_AXES,
  pointsToAttribute,
  polarPoint,
  radarAxisAngles,
  radarGridPolygons,
  radarMax,
  radarValuePoints,
  usableRadarAxes,
} from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, State, Watch } from '@stencil/core';

/**
 * A radar chart over `pf-radar-axis` children.
 *
 * The chart owns the drawing; each axis owns its own legend row, as a pie's
 * slices do. The axis names are attributes rather than slotted content,
 * because the chart has to draw them inside its own SVG and an SVG `<text>`
 * cannot hold arbitrary markup.
 *
 * All of the trigonometry is core's, so this and the React `RadarChart` put
 * the same numbers in the same places — the grid rings and the value polygon
 * only line up if both were built from the same centre, radius and angles.
 *
 * @slot - the `pf-radar-axis` children.
 * @slot empty - what to show when there are too few axes to enclose anything.
 * @part svg - the drawing.
 * @part grid - one grid ring.
 * @part axis - one spoke.
 * @part area - the value polygon.
 * @part point - one vertex of it.
 * @part axis-label - one name drawn around the edge.
 * @part legend - the list the axes are slotted into.
 * @part empty - the empty state's box.
 */
@Component({
  tag: 'pf-radar-chart',
  styleUrl: 'pf-radar-chart.css',
  shadow: true,
})
export class PfRadarChart {
  @Element() el!: HTMLElement;

  /** Width of the drawing's viewBox, in pixels. Never below 180. */
  @Prop() size = 280;

  /** The scale's top. Defaults to the largest value, never below 1. */
  @Prop() max?: number;

  /** Grid rings, the outermost of which is the chart's edge. */
  @Prop() levels = 4;

  @Prop({ reflect: true }) showAxes = true;

  @Prop({ reflect: true }) showLegend = true;

  /** The chart's accessible name. */
  @Prop() label = 'Radar chart';

  /** What the axes add up to, which only the chart can see. */
  @State() axes: { label: string; value: number }[] = [];

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  /**
   * Re-reads the axes, for a consumer who changed a value through its
   * *property* — which leaves no attribute and fires no `slotchange`.
   */
  @Method()
  async refresh() {
    this.sync();
  }

  /**
   * Direct children only: a nested chart owns its own axes.
   *
   * **Not** called `children`. A component class's members land on the custom
   * element itself, so a private getter named after a DOM property shadows
   * it: `get children()` made `this.el.children` call itself, and the mock
   * DOM's own `getElementsByTagName` — which walks `.children` — recursed
   * until the stack ran out. Stencil warns about a `@Prop` that shadows a
   * prototype member (`animate` is one) but says nothing about a getter.
   */
  private get axisElements(): HTMLElement[] {
    return Array.from(this.el.children).filter(
      (child) => child.tagName.toLowerCase() === 'pf-radar-axis',
    ) as HTMLElement[];
  }

  @Watch('max')
  sync() {
    const children = this.axisElements;
    const read = children.map((axis) => {
      const node = axis as HTMLElement & { label?: string; value?: number };
      return {
        // The property if the child has upgraded, the attribute if it has not.
        label: node.label ?? axis.getAttribute('label') ?? '',
        value: Number(node.value ?? axis.getAttribute('value')),
      };
    });

    const usable = usableRadarAxes(read);
    const drawable = usable.length >= RADAR_MINIMUM_AXES;
    this.axes = drawable ? usable : [];

    /*
     * `drawn` is set per child by identity of its reading, not by position:
     * `usableRadarAxes` drops the ones it cannot plot, so its own positions
     * no longer line up with the children.
     */
    const usableSet = new Set(usable);
    for (const [index, axis] of children.entries()) {
      (axis as HTMLElement & { drawn: boolean }).drawn = drawable && usableSet.has(read[index]);
    }
  }

  render() {
    const size = Math.max(Number(this.size) || 280, 180);
    const center = size / 2;
    // Room for the names drawn around the edge.
    const radius = center - 36;

    if (this.axes.length < RADAR_MINIMUM_AXES) {
      return (
        <Host>
          <div class="empty" part="empty">
            <slot name="empty">A radar chart needs at least {RADAR_MINIMUM_AXES} axes.</slot>
          </div>
          {/*
            The list stays in the tree even with too few axes: a slot that is
            not rendered never fires `slotchange`, so an axis added later
            would never be counted.
          */}
          <ul class="legend legend--hidden" part="legend">
            <slot onSlotchange={() => this.refresh()} />
          </ul>
        </Host>
      );
    }

    const max = radarMax(this.axes, this.max);
    const angles = radarAxisAngles(this.axes.length);
    const rings = radarGridPolygons(angles, center, radius, Number(this.levels));
    const points = radarValuePoints(
      this.axes.map((axis) => axis.value),
      max,
      angles,
      center,
      radius,
    );

    return (
      <Host>
        <svg
          class="svg"
          part="svg"
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={this.label}
        >
          {rings.map((ring) => (
            <polygon class="grid" part="grid" points={ring} />
          ))}

          {this.showAxes &&
            angles.map((angle) => {
              const end = polarPoint(center, radius, angle);
              return (
                <line class="axis" part="axis" x1={center} y1={center} x2={end.x} y2={end.y} />
              );
            })}

          {/*
            The grow-from-the-centre animation has to scale about the chart's
            middle, not about the group's own bounding box — which moves with
            the data, so the shape would grow from wherever it happens to be
            heaviest. `transform-origin` is what says so.

            `transform-box: view-box` alongside it is the initial value in
            current browsers (an early draft defaulted SVG to `border-box`),
            so it is belt-and-braces rather than load-bearing — measured, by
            removing it and watching nothing change.
          */}
          <g
            class="value"
            style={{ transformBox: 'view-box', transformOrigin: `${center}px ${center}px` }}
          >
            <polygon class="area" part="area" points={pointsToAttribute(points)} />
            {points.map((point) => (
              <circle class="point" part="point" cx={point.x} cy={point.y} r="3" />
            ))}
          </g>

          {angles.map((angle, index) => {
            const at = polarPoint(center, radius + 18, angle);
            return (
              <text
                class="axis-label"
                part="axis-label"
                x={at.x}
                y={at.y}
                text-anchor="middle"
                dominant-baseline="middle"
              >
                {this.axes[index].label}
              </text>
            );
          })}
        </svg>

        <ul class={{ legend: true, 'legend--hidden': !this.showLegend }} part="legend">
          <slot onSlotchange={() => this.refresh()} />
        </ul>
      </Host>
    );
  }
}
