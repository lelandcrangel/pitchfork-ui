import { clampRating, formatRating, starFillPercent } from '@pitchfork-ui/core';
import { forwardRef, type CSSProperties } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Rating.css';

export interface RatingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  ariaLabel?: string;
}

export const RatingStars = forwardRef<HTMLDivElement, RatingStarsProps>(function RatingStars(
  { value, max = 5, size = 18, showValue = false, ariaLabel, className, ...props },
  ref,
) {
  const clampedValue = clampRating(value, max);

  return (
    <div
      ref={ref}
      className={cx('pf-rating-stars', className)}
      role="img"
      aria-label={ariaLabel ?? `Rating ${clampedValue} out of ${max}`}
      {...props}
    >
      <div className="pf-rating-stars__track" aria-hidden>
        {Array.from({ length: max }, (_, index) => {
          const fillPercent = starFillPercent(clampedValue, index);

          return (
            <span
              key={index}
              className="pf-rating-stars__star"
              style={
                {
                  '--pf-rating-fill': `${fillPercent}%`,
                  '--pf-rating-size': `${size}px`,
                } as CSSProperties
              }
            >
              <Icon
                name="star"
                aria-hidden
                className="pf-rating-stars__star-icon pf-rating-stars__star-icon--base"
              />
              <span className="pf-rating-stars__star-fill" aria-hidden>
                <Icon
                  name="star"
                  className="pf-rating-stars__star-icon pf-rating-stars__star-icon--fill"
                />
              </span>
            </span>
          );
        })}
      </div>
      {showValue ? (
        <span className="pf-rating-stars__value">{formatRating(clampedValue)}</span>
      ) : null}
    </div>
  );
});
RatingStars.displayName = 'RatingStars';

export interface RatingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  max?: number;
  reviews?: number;
  size?: 'sm' | 'md';
}

export const RatingBadge = forwardRef<HTMLSpanElement, RatingBadgeProps>(function RatingBadge(
  { value, max = 5, reviews, size = 'md', className, ...props },
  ref,
) {
  const clampedValue = clampRating(value, max);

  return (
    <span
      ref={ref}
      className={cx('pf-rating-badge', `pf-rating-badge--${size}`, className)}
      {...props}
    >
      <Icon name="star" aria-hidden className="pf-rating-badge__icon" />
      <span className="pf-rating-badge__value">
        {/* One decimal either side, core's, so `<pf-rating-badge>` reads the same. */}
        {formatRating(clampedValue)}
        <span className="pf-rating-badge__separator">/</span>
        {formatRating(max)}
      </span>
      {typeof reviews === 'number' ? (
        <span className="pf-rating-badge__reviews">({reviews.toLocaleString()})</span>
      ) : null}
    </span>
  );
});
RatingBadge.displayName = 'RatingBadge';
