import {
  clampProgressPercent,
  getProgressCircleGeometry,
  progressValueNow,
} from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A circular determinate progress track.
 *
 * @part svg - the drawing surface.
 * @part track - the unfilled ring.
 * @part fill - the drawn arc.
 * @part value - the percentage readout.
 */
@Component({
  tag: 'pf-progress-circle',
  styleUrl: 'pf-progress-circle.css',
  shadow: true,
})
export class PfProgressCircle {
  /** How far along, on the 0..max scale. */
  @Prop() value = 0;

  /** The top of the scale. */
  @Prop() max = 100;

  /** Diameter in pixels. */
  @Prop() size = 64;

  /** Ring thickness in pixels. */
  @Prop() strokeWidth = 6;

  /** Show the percentage in the middle. Reflected for the stylesheet. */
  @Prop({ reflect: true }) showValue = true;

  /** Accessible name. */
  @Prop() label?: string;

  render() {
    const percent = clampProgressPercent(this.value, this.max);
    // The arc only lands on the right angle if the dash offset and the dash
    // array come from the same radius, which is why core returns them together.
    const { radius, circumference, dashOffset, center } = getProgressCircleGeometry(
      this.size,
      this.strokeWidth,
      percent,
    );

    return (
      <Host
        role="progressbar"
        aria-label={this.label}
        aria-valuemin="0"
        aria-valuemax={`${this.max}`}
        aria-valuenow={`${progressValueNow(percent, this.max)}`}
        style={{ '--pf-progress-circle-size': `${this.size}px` }}
      >
        <svg
          class="svg"
          part="svg"
          viewBox={`0 0 ${this.size} ${this.size}`}
          aria-hidden="true"
          focusable="false"
        >
          <circle
            class="circle-track"
            part="track"
            cx={`${center}`}
            cy={`${center}`}
            r={`${radius}`}
            stroke-width={`${this.strokeWidth}`}
          />
          <circle
            class="circle-fill"
            part="fill"
            cx={`${center}`}
            cy={`${center}`}
            r={`${radius}`}
            stroke-width={`${this.strokeWidth}`}
            stroke-dasharray={`${circumference}`}
            style={{
              '--pf-progress-dashoffset': `${dashOffset}`,
              '--pf-progress-circ': `${circumference}`,
            }}
          />
        </svg>
        {this.showValue && (
          <span class="value" part="value">
            {Math.round(percent)}%
          </span>
        )}
      </Host>
    );
  }
}
