import { clampProgressPercent, getProgressCircleGeometry } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A single value drawn as a filled arc, with a label in the middle.
 *
 * The geometry is `getProgressCircleGeometry`, which `pf-progress-circle` and
 * the React `ProgressCircle` already share: the dash offset only lands on the
 * right angle if it and the circumference came from the same radius, and the
 * radius has to be inset by half the stroke or half of it paints outside the
 * viewBox.
 *
 * It names itself with `label` where the React `GaugeChart` puts the
 * percentage in `aria-label`. A meter's name should say what is being
 * measured; the value belongs in `aria-valuetext`, which is where a reader
 * looks for it, and announcing "73%" as the name of a thing leaves a reader
 * with no idea what is 73% full.
 *
 * @slot center - replaces the percentage in the middle.
 * @slot sub - a second line under it.
 * @part svg - the arc's canvas.
 * @part track - the unfilled ring.
 * @part fill - the filled arc.
 * @part center - the box in the middle.
 * @part label - the big number.
 */
@Component({
  tag: 'pf-gauge-chart',
  styleUrl: 'pf-gauge-chart.css',
  shadow: true,
})
export class PfGaugeChart {
  @Prop() value = 0;

  @Prop() max = 100;

  /** Diameter, in pixels. */
  @Prop() size = 200;

  /** The arc's thickness, in pixels. */
  @Prop() strokeWidth = 16;

  /** Overrides the token colour. */
  @Prop() color?: string;

  /** What is being measured. The meter's accessible name. */
  @Prop() label = 'Gauge';

  render() {
    const size = Number(this.size) || 200;
    const strokeWidth = Number(this.strokeWidth) || 16;
    const percent = Math.round(clampProgressPercent(Number(this.value), Number(this.max)));
    const { radius, circumference, dashOffset, center } = getProgressCircleGeometry(
      size,
      strokeWidth,
      percent,
    );
    const stroke = this.color ?? 'var(--pf-gauge-color)';

    return (
      <Host
        role="meter"
        aria-label={this.label}
        aria-valuenow={String(this.value)}
        aria-valuemin="0"
        aria-valuemax={String(this.max)}
        aria-valuetext={`${percent}%`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg
          class="svg"
          part="svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
        >
          <circle
            class="track"
            part="track"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke-width={strokeWidth}
          />
          {/* Rotated so the arc starts at twelve o'clock rather than at three. */}
          <circle
            class="fill"
            part="fill"
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={stroke}
            stroke-width={strokeWidth}
            stroke-linecap="round"
            stroke-dasharray={circumference}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: `${center}px ${center}px`,
              '--pf-gauge-circumference': String(circumference),
              '--pf-gauge-offset': String(dashOffset),
            }}
          />
        </svg>

        <div class="center" part="center" aria-hidden="true">
          <span class="label" part="label">
            <slot name="center">{percent}%</slot>
          </span>
          {/*
            No wrapper around this slot. An *unassigned* slot is
            `display: contents` and generates nothing, so nothing is laid out
            when there is no sub-label — where a wrapper would still be a flex
            item and still cost the `--space-1` gap above it, and could not be
            collapsed from CSS: `:has()` on a slot's assigned content is not
            expressible, because assigned nodes are not the slot's children.
          */}
          <slot name="sub" />
        </div>
      </Host>
    );
  }
}
