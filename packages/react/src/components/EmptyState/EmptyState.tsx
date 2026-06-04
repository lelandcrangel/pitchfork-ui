import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from '../Icon';
import './EmptyState.css';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconName?: IconName;
  action?: React.ReactNode;
  size?: EmptyStateSize;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    {
      className,
      heading,
      description,
      icon,
      iconName,
      action,
      size = 'md',
      ...props
    },
    ref,
  ) {
    const resolvedIcon = icon ?? (iconName ? <Icon name={iconName} aria-hidden /> : null);

    return (
      <div
        ref={ref}
        className={cx('pf-empty-state', `pf-empty-state--${size}`, className)}
        {...props}
      >
        {resolvedIcon ? (
          <span className="pf-empty-state__icon" aria-hidden>
            {resolvedIcon}
          </span>
        ) : null}
        <p className="pf-empty-state__heading">{heading}</p>
        {description ? (
          <p className="pf-empty-state__description">{description}</p>
        ) : null}
        {action ? (
          <div className="pf-empty-state__action">{action}</div>
        ) : null}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';
