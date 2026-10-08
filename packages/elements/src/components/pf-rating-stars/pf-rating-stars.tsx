import { clampRating, formatRating, starFillPercent } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A row of stars showing a rating, filled to the fraction.
 *
 * One `role="img"` with a name rather than a star-by-star reading: the stars
 * are an image of the rating, and the number is the thing worth announcing.
 * Every star inside is therefore `aria-hidden`.
 *
 * @part track - the row of stars.
 * @part star - one star, filled to its own share of the rating.
 * @part value - the rating written out, when `showValue` is set.
 */
@Component({
  tag: 'pf-rating-stars',
  styleUrl: 'pf-rating-stars.css',
  shadow: true,
})
export class PfRatingStars {
  /** The rating. Clamped into 0..max, so it cannot overfill the row. */
  @Prop() value = 0;

  /** How many stars there are. */
  @Prop() max = 5;

  /** Star size in pixels. */
  @Prop() size = 18;

  /** Write the rating out beside the stars. */
  @Prop() showValue = false;

  /** Overrides the generated name, for a rating that means something else. */
  @Prop() label?: string;

  /**
   * Coerced, because the stars are built from it: `Number(max)` of an
   * attribute string works by luck in a loop count and not at all in
   * arithmetic, and a nonsense value would render an empty row rather than
   * throwing.
   */
  private get count(): number {
    const asNumber = Math.round(Number(this.max));
    return Number.isFinite(asNumber) ? Math.max(asNumber, 0) : 0;
  }

  render() {
    const max = this.count;
    const value = clampRating(Number(this.value), max);

    return (
      <Host role="img" aria-label={this.label ?? `Rating ${value} out of ${max}`}>
        <div class="track" part="track" aria-hidden="true">
          {Array.from({ length: max }, (_, index) => (
            <span
              class="star"
              part="star"
              style={{
                '--pf-rating-fill': `${starFillPercent(value, index)}%`,
                '--pf-rating-size': `${Number(this.size)}px`,
              }}
            >
              <pf-icon class="icon base" name="star"></pf-icon>
              <span class="fill">
                <pf-icon class="icon filled" name="star"></pf-icon>
              </span>
            </span>
          ))}
        </div>
        {this.showValue && (
          <span class="value" part="value">
            {formatRating(value)}
          </span>
        )}
      </Host>
    );
  }
}
