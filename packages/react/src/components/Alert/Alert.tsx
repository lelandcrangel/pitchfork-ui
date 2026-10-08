import { liveRegionRole, severityIconName } from '@pitchfork-ui/core';
import { forwardRef } from 'react';
import { useComposedRefs, useExitAnimation } from '../../hooks';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Alert.css';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      heading,
      description,
      dismissible = false,
      onDismiss,
      icon,
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
          'pf-alert',
          `pf-alert--${variant}`,
          isExiting && 'pf-alert--exiting',
          className,
        )}
        role={liveRegionRole(variant)}
        {...props}
      >
        <span className="pf-alert__icon" aria-hidden>
          {resolvedIcon}
        </span>

        <div className="pf-alert__content">
          {heading ? <p className="pf-alert__title">{heading}</p> : null}
          {body ? <div className="pf-alert__description">{body}</div> : null}
        </div>

        {dismissible ? (
          <button
            type="button"
            className="pf-alert__dismiss"
            aria-label="Dismiss alert"
            onClick={startExit}
          >
            <Icon name="circle-xmark" aria-hidden />
          </button>
        ) : null}
      </div>
    );
  },
);

Alert.displayName = 'Alert';
