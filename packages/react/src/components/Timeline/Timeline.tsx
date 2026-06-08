import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './Timeline.css';

export type TimelineTone = 'default' | 'success' | 'warning' | 'danger';

export interface TimelineItem {
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Short timestamp / meta text shown alongside the title. */
  timestamp?: React.ReactNode;
  /** Optional icon rendered inside the marker (replaces the default dot). */
  icon?: React.ReactNode;
  /** Marker colour. Defaults to `'default'` (brand). */
  tone?: TimelineTone;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[];
}

export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { className, items, ...props },
  ref,
) {
  return (
    <ol ref={ref} className={cx('pf-timeline', className)} {...props}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'default';
        const isLast = index === items.length - 1;
        return (
          <li
            key={item.id ?? index}
            className={cx('pf-timeline__item', isLast && 'pf-timeline__item--last')}
          >
            <div className="pf-timeline__rail" aria-hidden>
              <span className={cx('pf-timeline__marker', `pf-timeline__marker--${tone}`)}>
                {item.icon ? <span className="pf-timeline__marker-icon">{item.icon}</span> : null}
              </span>
              {!isLast ? <span className="pf-timeline__connector" /> : null}
            </div>

            <div className="pf-timeline__content">
              <div className="pf-timeline__header">
                <p className="pf-timeline__title">{item.title}</p>
                {item.timestamp ? (
                  <span className="pf-timeline__timestamp">{item.timestamp}</span>
                ) : null}
              </div>
              {item.description ? (
                <div className="pf-timeline__description">{item.description}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
});

Timeline.displayName = 'Timeline';
