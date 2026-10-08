import { clampProgressPercent, progressValueNow } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A horizontal determinate progress track.
 *
 * @part track - the unfilled groove.
 * @part fill - the filled portion.
 * @part value - the percentage readout.
 */
@Component({
  tag: 'pf-progress-bar',
  styleUrl: 'pf-progress-bar.css',
  shadow: true,
})
export class PfProgressBar {
  /** How far along, on the 0..max scale. */
  @Prop() value = 0;

  /** The top of the scale. */
  @Prop() max = 100;

  /** Show the percentage beside the track. Reflected for the stylesheet. */
  @Prop({ reflect: true }) showValue = true;

  /** Accessible name. */
  @Prop() label?: string;

  render() {
    // Both layers go through core, so the same value and max always report the
    // same aria-valuenow and draw the same fill.
    const percent = clampProgressPercent(this.value, this.max);

    return (
      <Host
        role="progressbar"
        aria-label={this.label}
        aria-valuemin="0"
        aria-valuemax={`${this.max}`}
        aria-valuenow={`${progressValueNow(percent, this.max)}`}
      >
        <div class="track" part="track">
          <div class="fill" part="fill" style={{ '--pf-progress-fill': `${percent}%` }} />
        </div>
        {this.showValue && (
          <span class="value" part="value">
            {Math.round(percent)}%
          </span>
        )}
      </Host>
    );
  }
}
