import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './BadgeGroup.css';

export type BadgeGroupColor =
  | 'gray'
  | 'brand'
  | 'error'
  | 'warning'
  | 'success';
export type BadgeGroupAppearance = 'pill' | 'modern';
export type BadgeGroupBadgePosition = 'leading' | 'trailing';

export interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  message: string;
  color?: BadgeGroupColor;
  appearance?: BadgeGroupAppearance;
  badgePosition?: BadgeGroupBadgePosition;
}

export const BadgeGroup = forwardRef<HTMLDivElement, BadgeGroupProps>(
  (
    {
      label,
      message,
      color = 'gray',
      appearance = 'pill',
      badgePosition = 'leading',
      className,
      ...props
    },
    ref,
  ) => {
    const badge = (
      <span
        className={cx(
          'pf-badge-group__badge',
          `pf-badge-group__badge--${color}`,
        )}
      >
        {label}
      </span>
    );

    const text = (
      <span
        className={cx(
          'pf-badge-group__text',
          `pf-badge-group__text--${appearance}`,
          `pf-badge-group__text--${color}`,
        )}
      >
        {message}
      </span>
    );

    return (
      <div
        ref={ref}
        className={cx(
          'pf-badge-group',
          `pf-badge-group--${appearance}`,
          `pf-badge-group--${badgePosition}`,
          className,
        )}
        {...props}
      >
        {badgePosition === 'leading' ? (
          <>
            {badge}
            {text}
          </>
        ) : (
          <>
            {text}
            {badge}
          </>
        )}
      </div>
    );
  },
);

BadgeGroup.displayName = 'BadgeGroup';
