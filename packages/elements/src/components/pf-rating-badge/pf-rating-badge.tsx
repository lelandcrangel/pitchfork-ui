import { clampRating, formatRating } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

export type PfRatingBadgeSize = 'sm' | 'md';

/**
 * A rating as a compact pill: one star, the number out of the maximum, and
 * optionally how many reviews it came from.
 *
 * @part icon - the star.
 * @part value - the rating and the maximum.
 * @part reviews - the review count, when `reviews` is set.
 */
@Component({
  tag: 'pf-rating-badge',
  styleUrl: 'pf-rating-badge.css',
  shadow: true,
})
export class PfRatingBadge {
  /** The rating. Clamped into 0..max. */
  @Prop() value = 0;

  /** The top of the scale. */
  @Prop() max = 5;

  /**
   * How many reviews the rating came from. Omit it to show no count at all —
   * which is different from `0`, a product nobody has reviewed yet.
   */
  @Prop() reviews?: number;

  /** Padding and height. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) size: PfRatingBadgeSize = 'md';

  render() {
    const max = Number(this.max);
    const value = clampRating(Number(this.value), max);
    const reviews = this.reviews;

    return (
      <Host>
        <pf-icon class="icon" part="icon" name="star" aria-hidden="true"></pf-icon>
        <span class="value" part="value">
          {formatRating(value)}
          <span class="separator">/</span>
          {formatRating(max)}
        </span>
        {reviews !== undefined && reviews !== null && (
          <span class="reviews" part="reviews">
            ({Number(reviews).toLocaleString()})
          </span>
        )}
      </Host>
    );
  }
}
