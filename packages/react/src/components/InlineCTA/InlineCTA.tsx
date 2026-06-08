import { forwardRef } from 'react';
import { useExitAnimation } from '../../hooks';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from '../Icon';
import './InlineCTA.css';

export type InlineCTATone = 'default' | 'info' | 'success' | 'warning';

export interface InlineCTAProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  iconName?: IconName;
  tone?: InlineCTATone;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const InlineCTA = forwardRef<HTMLDivElement, InlineCTAProps>(function InlineCTA(
  {
    className,
    heading,
    description,
    action,
    icon,
    iconName = 'circle-question',
    tone = 'default',
    dismissible = false,
    onDismiss,
    children,
    ...props
  },
  ref,
) {
  const resolvedIcon = icon ?? <Icon name={iconName} aria-hidden />;
  const { isExiting, startExit } = useExitAnimation({ onExited: onDismiss });

  return (
    <div
      ref={ref}
      className={cx(
        'pf-inline-cta',
        `pf-inline-cta--${tone}`,
        dismissible && 'pf-inline-cta--dismissible',
        isExiting && 'pf-inline-cta--exiting',
        className,
      )}
      {...props}
    >
      <span className="pf-inline-cta__icon" aria-hidden>
        {resolvedIcon}
      </span>

      <div className="pf-inline-cta__content">
        {heading ? <p className="pf-inline-cta__heading">{heading}</p> : null}
        {description ? <p className="pf-inline-cta__description">{description}</p> : null}
        {children}
      </div>

      {action ? <div className="pf-inline-cta__action">{action}</div> : null}

      {dismissible ? (
        <button
          type="button"
          className="pf-inline-cta__dismiss"
          aria-label="Dismiss"
          onClick={startExit}
        >
          <Icon name="circle-xmark" aria-hidden />
        </button>
      ) : null}
    </div>
  );
});

InlineCTA.displayName = 'InlineCTA';
