import { cx } from '../../utils/cx';
import { Icon, type IconName } from '../Icon';
import './Alert.css';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const variantIcon: Record<AlertVariant, IconName> = {
  info: 'circle-question',
  success: 'circle-check',
  warning: 'circle-question',
  danger: 'circle-xmark',
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  heading?: React.ReactNode;
  description?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export function Alert({
  className,
  variant = 'info',
  heading,
  description,
  dismissible = false,
  onDismiss,
  icon,
  children,
  ...props
}: AlertProps) {
  const resolvedIcon = icon ?? <Icon name={variantIcon[variant]} aria-hidden />;
  const body = children ?? description;

  return (
    <div
      className={cx('pf-alert', `pf-alert--${variant}`, className)}
      role="alert"
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
          onClick={() => onDismiss?.()}
        >
          <Icon name="circle-xmark" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
