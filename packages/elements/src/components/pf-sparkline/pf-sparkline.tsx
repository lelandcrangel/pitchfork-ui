import { sparklineAreaPath, sparklineLinePath, sparklinePoints } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A small line or area chart with no axes.
 *
 * All of the geometry is core's, so this and the React `Sparkline` put the
 * same numbers in the same places — including the three edge cases that were
 * wrong before the extraction: one value gave `NaN`, a flat series was pinned
 * to an edge, and the closing branch of the old path builder interpolated a
 * boolean.
 *
 * @part svg - the chart.
 * @part area - the filled region, on the `area` variant.
 * @part line - the line.
 * @part dot - the dot at the last point, when `endDot` is set.
 */
@Component({
  tag: 'pf-sparkline',
  styleUrl: 'pf-sparkline.css',
  shadow: true,
})
export class PfSparkline {
  /**
   * The values to plot.
   *
   * A `number[]` for a framework consumer, and a comma-separated string for
   * plain HTML — `data="1,4,2,8"` — because Stencil coerces an attribute only
   * for the primitive types it recognises and would otherwise hand this the
   * string verbatim. Read through `values` below, never directly: the same
   * trap `pf-time-picker.hourCycle` hit, where a union-typed prop silently
   * arrived as a string.
   */
  @Prop() data: number[] | string = [];

  @Prop() width = 120;

  @Prop() height = 36;

  /** `line` draws only the stroke; `area` fills under it too. Reflected. */
  @Prop({ reflect: true }) variant: 'line' | 'area' = 'line';

  @Prop() strokeWidth = 1.5;

  /** Overrides the token colour, for a chart that has to match its data. */
  @Prop() color?: string;

  /** Draw a dot at the last value. */
  @Prop({ reflect: true }) endDot = false;

  /**
   * Draw the line in on first paint. Off by default. Reflected.
   *
   * `animated`, where the React prop is `animate`: `animate` is a **reserved
   * public name** — `Element.prototype.animate` is the Web Animations API —
   * and Stencil refuses to build a prop that shadows a prototype member. The
   * React component is a function taking props and has no such collision.
   */
  @Prop({ reflect: true }) animated = false;

  /**
   * The chart's accessible name.
   *
   * Without one the chart is `presentation`: a sparkline with no name is
   * decoration beside a number that already says what it means, and
   * announcing an unnamed graphic is worse than skipping it.
   */
  @Prop() label?: string;

  /** The values, however they arrived. */
  private get values(): number[] {
    if (Array.isArray(this.data)) return this.data.map(Number).filter(Number.isFinite);

    return String(this.data ?? '')
      .split(',')
      .map((part) => Number(part.trim()))
      .filter(Number.isFinite);
  }

  render() {
    const width = Number(this.width) || 120;
    const height = Number(this.height) || 36;
    const strokeWidth = Number(this.strokeWidth) || 1.5;
    const padding = strokeWidth + 2;

    const points = sparklinePoints(this.values, { width, height, padding });
    const line = sparklineLinePath(points);
    const area =
      this.variant === 'area' ? sparklineAreaPath(points, height - padding + strokeWidth) : '';
    const last = points[points.length - 1];
    const stroke = this.color ?? 'var(--pf-sparkline-color)';

    return (
      <Host>
        <svg
          class="svg"
          part="svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role={this.label ? 'img' : 'presentation'}
          aria-label={this.label}
        >
          {area && <path class="area" part="area" d={area} fill={stroke} />}
          {line && (
            <path
              class="line"
              part="line"
              d={line}
              fill="none"
              stroke={stroke}
              stroke-width={strokeWidth}
              stroke-linecap="round"
              stroke-linejoin="round"
              // The dash maths below is then independent of the real length.
              pathLength={this.animated ? 1 : undefined}
            />
          )}
          {this.endDot && last && (
            <circle
              class="dot"
              part="dot"
              cx={last[0]}
              cy={last[1]}
              r={strokeWidth + 1.5}
              fill={stroke}
            />
          )}
        </svg>
      </Host>
    );
  }
}
