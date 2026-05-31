import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from '../Icon';
import './Notification.css';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'danger';
export type NotificationPlacement =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

const variantIcon: Record<NotificationVariant, IconName> = {
  info: 'circle-info',
  success: 'circle-check',
  warning: 'triangle-exclamation',
  danger: 'circle-xmark',
};

export interface NotificationStackProps extends React.HTMLAttributes<HTMLDivElement> {
  placement?: NotificationPlacement;
}

export interface NotificationProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
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
      className={cx(
        'pf-notification-stack',
        `pf-notification-stack--${placement}`,
        className,
      )}
      {...props}
    />
  ),
);
NotificationStack.displayName = 'NotificationStack';

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant = 'info', heading, description, icon, action, dismissible = false, onDismiss, children, ...props }, ref) => {
  const resolvedIcon = icon ?? <Icon name={variantIcon[variant]} aria-hidden />;
  const body = children ?? description;

  return (
    <div
      ref={ref}
      className={cx(
        'pf-notification',
        `pf-notification--${variant}`,
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
        {body ? (
          <div className="pf-notification__description">{body}</div>
        ) : null}
        {action ? (
          <div className="pf-notification__action">{action}</div>
        ) : null}
      </div>

      {dismissible ? (
        <button
          type="button"
          className="pf-notification__dismiss"
          aria-label="Dismiss notification"
          onClick={() => onDismiss?.()}
        >
          <Icon name="circle-xmark" aria-hidden />
        </button>
      ) : null}
    </div>
  );
});

Notification.displayName = 'Notification';
