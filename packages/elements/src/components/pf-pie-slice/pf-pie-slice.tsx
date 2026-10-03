import { Component, h, Host, Prop } from '@stencil/core';

/**
 * One slice of a `pf-pie-chart`, and its own row in the legend.
 *
 * The React `PieChart` takes a `data` array of `{ label, value, color }`; a
 * slot renders its assigned content once and in one place, so there is no way
 * for the chart's shadow root to build a legend out of labels that live in the
 * light DOM. The slice renders its own row instead, which is the §2.1 idiom
 * and lets a consumer put anything in a label.
 *
 * `swatch`, `share` and `drawn` are the chart's to set: only it can see the
 * total.
 *
 * @slot - the slice's label.
 * @part dot - the colour swatch.
 * @part label - the label's box.
 * @part value - the share, as a whole percentage.
 */
@Component({
  tag: 'pf-pie-slice',
  styleUrl: 'pf-pie-slice.css',
  shadow: true,
})
export class PfPieSlice {
  /** How big the slice is, in whatever unit the chart's slices share. */
  @Prop({ reflect: true }) value = 0;

  /** Overrides the palette colour the chart would give it. */
  @Prop({ reflect: true }) color?: string;

  /** Set by the chart: the colour actually used, palette or override. */
  @Prop({ mutable: true }) swatch = '';

  /** Set by the chart: this slice's share, as a whole percentage. */
  @Prop({ mutable: true }) share = 0;

  /**
   * Set by the chart: whether this slice is in the drawing at all.
   *
   * A slice of zero is not a wedge, so it is not a legend row either —
   * otherwise the legend lists colours that appear nowhere in the chart.
   * Reflected, because that is what the stylesheet hides it with.
   */
  @Prop({ mutable: true, reflect: true }) drawn = false;

  render() {
    return (
      <Host role="listitem">
        <span class="dot" part="dot" aria-hidden="true" style={{ background: this.swatch }}></span>
        <span class="label" part="label">
          <slot />
        </span>
        <span class="value" part="value">
          {this.share}%
        </span>
      </Host>
    );
  }
}
