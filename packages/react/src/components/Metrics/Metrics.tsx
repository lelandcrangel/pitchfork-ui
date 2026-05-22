import { cx } from '../../utils/cx';
import { Icon, type IconName } from '../Icon';
import './Metrics.css';

export type MetricTrend = 'positive' | 'negative' | 'neutral';

export interface MetricGridProps extends React.HTMLAttributes<HTMLDivElement> {}

export interface MetricCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  heading: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  trend?: MetricTrend;
  trendLabel?: React.ReactNode;
  icon?: React.ReactNode;
  iconName?: IconName;
  action?: React.ReactNode;
}

const trendSymbol: Record<MetricTrend, string> = {
  positive: '+',
  negative: '-',
  neutral: '=',
};

export function MetricGrid({ className, ...props }: MetricGridProps) {
  return <div className={cx('pf-metric-grid', className)} {...props} />;
}

export function MetricCard({
  className,
  heading,
  value,
  description,
  trend = 'neutral',
  trendLabel,
  icon,
  iconName,
  action,
  children,
  ...props
}: MetricCardProps) {
  const resolvedIcon =
    icon ?? (iconName ? <Icon name={iconName} aria-hidden /> : null);

  return (
    <div className={cx('pf-metric-card', className)} {...props}>
      <div className="pf-metric-card__header">
        <div className="pf-metric-card__heading-wrap">
          <p className="pf-metric-card__heading">{heading}</p>
          {resolvedIcon ? (
            <span className="pf-metric-card__icon" aria-hidden>
              {resolvedIcon}
            </span>
          ) : null}
        </div>
        {action ? <div className="pf-metric-card__action">{action}</div> : null}
      </div>

      <div className="pf-metric-card__body">
        <p className="pf-metric-card__value">{value}</p>
        {trendLabel ? (
          <span
            className={cx(
              'pf-metric-card__trend',
              `pf-metric-card__trend--${trend}`,
            )}
          >
            <span className="pf-metric-card__trend-symbol" aria-hidden>
              {trendSymbol[trend]}
            </span>
            {trendLabel}
          </span>
        ) : null}
      </div>

      {description ? (
        <p className="pf-metric-card__description">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
