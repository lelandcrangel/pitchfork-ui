import { resolveCurrentCrumb } from '@pitchfork-ui/core';
import { forwardRef } from 'react';
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

export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(
  (
    { className, items, separator = '/', 'aria-label': ariaLabel = 'Breadcrumb', ...props },
    ref,
  ) => {
    /*
     * One index, core's, so `<pf-breadcrumbs>` marks the same crumb — and so a
     * trail cannot mark two pages. Reading `item.current ?? isLast` per item
     * did: marking any crumb but the last left `aria-current="page"` on both
     * it and the last one.
     */
    const currentIndex = resolveCurrentCrumb(items);

    return (
      <nav ref={ref} className={cx('pf-breadcrumbs', className)} aria-label={ariaLabel} {...props}>
        <ol className="pf-breadcrumbs__list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isCurrent = index === currentIndex;

            return (
              <li
                key={`${index}-${typeof item.label === 'string' ? item.label : 'item'}`}
                className="pf-breadcrumbs__item"
              >
                {item.href ? (
                  <a
                    href={item.href}
                    onClick={item.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
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
  },
);

Breadcrumbs.displayName = 'Breadcrumbs';
