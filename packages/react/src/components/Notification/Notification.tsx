import { forwardRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from '../Icon';
import './Notification.css';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Matches the exit animation duration (--duration-moderate, 180ms) plus a small
// buffer so the slide-out finishes before the consumer unmounts the element.
const EXIT_DURATION_MS = 220;

export type NotificationVariant = 'info' | 'success' | 'warning' | 'danger';
export type NotificationPlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

const variantIcon: Record<NotificationVariant, IconName> = {
  info: 'circle-info',
  success: 'circle-check',
  warning: 'triangle-exclamation',
  danger: 'circle-xmark',
};

export interface NotificationStackProps extends React.HTMLAttributes<HTMLDivElement> {
  placement?: NotificationPlacement;
}

export interface NotificationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: NotificationVariant;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const NotificationStack = forwardRef<HTMLDivElement, NotificationStackProps>(
  ({ className, placement = 'top-right', ...props }, ref) => (
    <div
      ref={ref}
      className={cx('pf-notification-stack', `pf-notification-stack--${placement}`, className)}
      {...props}
    />
  ),
);
NotificationStack.displayName = 'NotificationStack';

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      className,
      variant = 'info',
      heading,
      description,
      icon,
      action,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref,
  ) => {
    const resolvedIcon = icon ?? <Icon name={variantIcon[variant]} aria-hidden />;
    const body = children ?? description;
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
      // With reduced motion there's no exit animation — dismiss immediately.
      // Otherwise play the slide-out, then notify once it has finished.
      if (prefersReducedMotion()) {
        onDismiss?.();
        return;
      }
      setIsExiting(true);
      window.setTimeout(() => onDismiss?.(), EXIT_DURATION_MS);
    };

    return (
      <div
        ref={ref}
        className={cx(
          'pf-notification',
          `pf-notification--${variant}`,
          isExiting && 'pf-notification--exiting',
          className,
        )}
        role="status"
        {...props}
      >
        <span className="pf-notification__icon" aria-hidden>
          {resolvedIcon}
        </span>

        <div className="pf-notification__content">
          {heading ? <p className="pf-notification__title">{heading}</p> : null}
          {body ? <div className="pf-notification__description">{body}</div> : null}
          {action ? <div className="pf-notification__action">{action}</div> : null}
        </div>

        {dismissible ? (
          <button
            type="button"
            className="pf-notification__dismiss"
            aria-label="Dismiss notification"
            onClick={handleDismiss}
          >
            <Icon name="circle-xmark" aria-hidden />
          </button>
        ) : null}
      </div>
    );
  },
);

Notification.displayName = 'Notification';
