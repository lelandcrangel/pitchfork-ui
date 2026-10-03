import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One axis of a `pf-radar-chart`, and its own row in the legend.
 *
 * The name is a `label` **attribute** rather than slotted content, which is
 * the one place this differs from the React `RadarChart`'s `ReactNode`: the
 * chart draws each name inside its own SVG as a `<text>`, and an SVG `<text>`
 * cannot hold arbitrary markup in either layer. The legend row the axis draws
 * for itself uses the same string, so the two always agree.
 *
 * @part label - the legend row's name.
 * @part value - the legend row's number.
 */
@Component({
  tag: 'pf-radar-axis',
  styleUrl: 'pf-radar-axis.css',
  shadow: true,
})
export class PfRadarAxis {
  /** The axis's name, drawn in the chart and in the legend. */
  @Prop({ reflect: true }) label = '';

  /** How far along this axis the shape reaches. */
  @Prop({ reflect: true }) value = 0;

  /**
   * Set by the chart: whether this axis is in the drawing.
   *
   * An axis with an unusable value is not drawn, so it is not a legend row
   * either — a legend naming an axis that appears nowhere is worse than a
   * shorter legend. Reflected, because that is what the stylesheet hides it
   * with.
   */
  @Prop({ mutable: true, reflect: true }) drawn = false;

  render() {
    return (
      <Host role="listitem">
        <span class="label" part="label">
          {this.label}
        </span>
        <span class="value" part="value">
          {this.value}
        </span>
      </Host>
    );
  }
}
