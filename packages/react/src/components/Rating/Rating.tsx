import type { CSSProperties } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Rating.css';

const clampRating = (value: number, max: number) =>
  Math.min(Math.max(value, 0), max);

const getStarFillPercent = (value: number, index: number) => {
  const position = index + 1;
  if (value >= position) {
    return 100;
  }

  if (value > index) {
    return Math.round((value - index) * 100);
  }

  return 0;
};

export interface RatingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  ariaLabel?: string;
}

export function RatingStars({
  value,
  max = 5,
  size = 18,
  showValue = false,
  ariaLabel,
  className,
  ...props
}: RatingStarsProps) {
  const clampedValue = clampRating(value, max);

  return (
    <div
      className={cx('pf-rating-stars', className)}
      role="img"
      aria-label={ariaLabel ?? `Rating ${clampedValue} out of ${max}`}
      {...props}
    >
      <div className="pf-rating-stars__track" aria-hidden>
        {Array.from({ length: max }, (_, index) => {
          const fillPercent = getStarFillPercent(clampedValue, index);

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
        <span className="pf-rating-stars__value">
          {clampedValue.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}

export interface RatingBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  max?: number;
  reviews?: number;
  size?: 'sm' | 'md';
}

export function RatingBadge({
  value,
  max = 5,
  reviews,
  size = 'md',
  className,
  ...props
}: RatingBadgeProps) {
  const clampedValue = clampRating(value, max);

  return (
    <span
      className={cx('pf-rating-badge', `pf-rating-badge--${size}`, className)}
      {...props}
    >
      <Icon name="star" aria-hidden className="pf-rating-badge__icon" />
      <span className="pf-rating-badge__value">
        {clampedValue.toFixed(1)}
        <span className="pf-rating-badge__separator">/</span>
        {max.toFixed(1)}
      </span>
      {typeof reviews === 'number' ? (
        <span className="pf-rating-badge__reviews">
          ({reviews.toLocaleString()})
        </span>
      ) : null}
    </span>
  );
}
