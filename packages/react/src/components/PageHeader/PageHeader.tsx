import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import { Breadcrumbs, type BreadcrumbsProps } from '../Breadcrumbs';
import './PageHeader.css';

/** @deprecated `@pitchfork-ui/react` is deprecated. `<pf-page-header>` absorbed it — slot into `pf-page-header`'s `metadata` slot. See Foundations → Migrating. */
export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbsProps['items'];
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. `<pf-page-header>` absorbed it — slot into `pf-page-header`'s `metadata` slot. See Foundations → Migrating. */
export type PageHeaderMetaProps = React.HTMLAttributes<HTMLDivElement>;

/** @deprecated `@pitchfork-ui/react` is deprecated. `<pf-page-header>` absorbed it — slot into `pf-page-header`'s `metadata` slot. See Foundations → Migrating. */
export const PageHeaderMeta = forwardRef<HTMLDivElement, PageHeaderMetaProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-page-header__meta', className)} {...props} />
  ),
);
PageHeaderMeta.displayName = 'PageHeaderMeta';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-page-header>`, or `PfPageHeader` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(function PageHeader(
  { className, eyebrow, heading, description, breadcrumbs, metadata, actions, children, ...props },
  ref,
) {
  return (
    <header ref={ref} className={cx('pf-page-header', className)} {...props}>
      {breadcrumbs?.length ? (
        <Breadcrumbs items={breadcrumbs} className="pf-page-header__breadcrumbs" />
      ) : null}

      <div className="pf-page-header__row">
        <div className="pf-page-header__content">
          {eyebrow ? <p className="pf-page-header__eyebrow">{eyebrow}</p> : null}
          <h1 className="pf-page-header__heading">{heading}</h1>
          {description ? <p className="pf-page-header__description">{description}</p> : null}
          {metadata ? <PageHeaderMeta>{metadata}</PageHeaderMeta> : null}
          {children}
        </div>

        {actions ? <div className="pf-page-header__actions">{actions}</div> : null}
      </div>
    </header>
  );
});

PageHeader.displayName = 'PageHeader';
