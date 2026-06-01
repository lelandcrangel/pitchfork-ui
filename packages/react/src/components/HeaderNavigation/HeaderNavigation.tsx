import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './HeaderNavigation.css';

export interface HeaderNavigationItem {
  label: React.ReactNode;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  active?: boolean;
}

export interface HeaderNavigationProps extends React.HTMLAttributes<HTMLElement> {
  brand?: React.ReactNode;
  items: HeaderNavigationItem[];
  actions?: React.ReactNode;
}

export const HeaderNavigation = forwardRef<HTMLElement, HeaderNavigationProps>(
  function HeaderNavigation(
    {
      className,
      brand,
      items,
      actions,
      'aria-label': ariaLabel = 'Header navigation',
      ...props
    },
    ref,
  ) {
  return (
    <header ref={ref} className={cx('pf-header-navigation', className)} {...props}>
      <nav className="pf-header-navigation__nav" aria-label={ariaLabel}>
        {brand ? (
          <div className="pf-header-navigation__brand">{brand}</div>
        ) : null}

        <ul className="pf-header-navigation__list">
          {items.map((item, index) => {
            const key = `${index}-${typeof item.label === 'string' ? item.label : 'item'}`;

            if (item.href) {
              return (
                <li key={key} className="pf-header-navigation__item">
                  <a
                    href={item.href}
                    onClick={
                      item.onClick as
                        | React.MouseEventHandler<HTMLAnchorElement>
                        | undefined
                    }
                    className={cx(
                      'pf-header-navigation__link',
                      item.active && 'pf-header-navigation__link--active',
                    )}
                    aria-current={item.active ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            }

            if (item.onClick) {
              return (
                <li key={key} className="pf-header-navigation__item">
                  <button
                    type="button"
                    onClick={
                      item.onClick as React.MouseEventHandler<HTMLButtonElement>
                    }
                    className={cx(
                      'pf-header-navigation__link',
                      item.active && 'pf-header-navigation__link--active',
                    )}
                    aria-current={item.active ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                </li>
              );
            }

            return (
              <li key={key} className="pf-header-navigation__item">
                <span
                  className={cx(
                    'pf-header-navigation__link',
                    item.active && 'pf-header-navigation__link--active',
                  )}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>

        {actions ? (
          <div className="pf-header-navigation__actions">{actions}</div>
        ) : null}
      </nav>
    </header>
  );
});

HeaderNavigation.displayName = 'HeaderNavigation';
