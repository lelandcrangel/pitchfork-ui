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
}

export function InlineCTA({
  className,
  heading,
  description,
  action,
  icon,
  iconName = 'circle-question',
  tone = 'default',
  children,
  ...props
}: InlineCTAProps) {
  const resolvedIcon = icon ?? <Icon name={iconName} aria-hidden />;

  return (
    <div
      className={cx('pf-inline-cta', `pf-inline-cta--${tone}`, className)}
      {...props}
    >
      <span className="pf-inline-cta__icon" aria-hidden>
        {resolvedIcon}
      </span>

      <div className="pf-inline-cta__content">
        {heading ? <p className="pf-inline-cta__heading">{heading}</p> : null}
        {description ? (
          <p className="pf-inline-cta__description">{description}</p>
        ) : null}
        {children}
      </div>

      {action ? <div className="pf-inline-cta__action">{action}</div> : null}
    </div>
  );
}
