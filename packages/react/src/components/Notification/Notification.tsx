import { liveRegionRole, severityIconName } from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { useComposedRefs, useExitAnimation } from '../../hooks';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Notification.css';

export type NotificationVariant = 'info' | 'success' | 'warning' | 'danger';
export type NotificationPlacement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

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
    const resolvedIcon = icon ?? <Icon name={severityIconName(variant)} aria-hidden />;
    const body = children ?? description;
    /*
     * The hook's `ref` goes on the element the exit animation runs on, which
     * is how it waits for the real animation rather than for a guessed
     * duration.
     */
    const {
      isExiting,
      startExit,
      ref: exitRef,
    } = useExitAnimation<HTMLDivElement>({
      onExited: onDismiss,
    });
    const rootRef = useComposedRefs(exitRef, ref);

    return (
      <div
        ref={rootRef}
        className={cx(
          'pf-notification',
          `pf-notification--${variant}`,
          isExiting && 'pf-notification--exiting',
          className,
        )}
        role={liveRegionRole(variant)}
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
            onClick={startExit}
          >
            <Icon name="circle-xmark" aria-hidden />
          </button>
        ) : null}
      </div>
    );
  },
);

Notification.displayName = 'Notification';
