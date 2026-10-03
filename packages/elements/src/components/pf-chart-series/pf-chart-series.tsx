import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One series of a `pf-line-chart` or a `pf-bar-chart`, and its own row in the
 * legend.
 *
 * The chart's data is a single array of rows keyed by series — bulk numbers,
 * which belong in a property — while the series are the part with names and
 * colours, which belong in the light DOM so a consumer can loop over them and
 * so the legend can hold their labels. A legend built in the chart's shadow
 * root could not reach a slotted label at all.
 *
 * `swatch` is the chart's to set: only it knows this series' place in the
 * palette.
 *
 * @slot - the series' name. Falls back to `seriesKey`.
 * @part dot - the colour swatch.
 * @part label - the name.
 */
@Component({
  tag: 'pf-chart-series',
  styleUrl: 'pf-chart-series.css',
  shadow: true,
})
export class PfChartSeries {
  /**
   * The property each data row carries this series' value under.
   *
   * `seriesKey`, not `key`: `key` is the vdom's own prop name and reserved,
   * the same family as `animate` shadowing `Element.prototype.animate`.
   */
  @Prop({ reflect: true }) seriesKey = '';

  /** Overrides the palette colour the chart would give it. */
  @Prop({ reflect: true }) color?: string;

  /** Draw this series' line dashed. Line charts only. Reflected. */
  @Prop({ reflect: true }) dashed = false;

  /** Set by the chart: the colour actually used, palette or override. */
  @Prop({ mutable: true }) swatch = '';

  render() {
    return (
      <Host role="listitem">
        <span class="dot" part="dot" aria-hidden="true" style={{ background: this.swatch }}></span>
        <span class="label" part="label">
          <slot>{this.seriesKey}</slot>
        </span>
      </Host>
    );
  }
}
