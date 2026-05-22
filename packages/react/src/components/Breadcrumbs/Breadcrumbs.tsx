import { cx } from '../../utils/cx';
import './Breadcrumbs.css';

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  current?: boolean;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export function Breadcrumbs({
  className,
  items,
  separator = '/',
  'aria-label': ariaLabel = 'Breadcrumb',
  ...props
}: BreadcrumbsProps) {
  return (
    <nav
      className={cx('pf-breadcrumbs', className)}
      aria-label={ariaLabel}
      {...props}
    >
      <ol className="pf-breadcrumbs__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current ?? isLast;

          return (
            <li
              key={`${index}-${typeof item.label === 'string' ? item.label : 'item'}`}
              className="pf-breadcrumbs__item"
            >
              {item.href ? (
                <a
                  href={item.href}
                  onClick={
                    item.onClick as
                      | React.MouseEventHandler<HTMLAnchorElement>
                      | undefined
                  }
                  className={cx(
                    'pf-breadcrumbs__link',
                    isCurrent && 'pf-breadcrumbs__link--current',
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cx(
                    'pf-breadcrumbs__link',
                    isCurrent && 'pf-breadcrumbs__link--current',
                  )}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast ? (
                <span className="pf-breadcrumbs__separator" aria-hidden>
                  {separator}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
