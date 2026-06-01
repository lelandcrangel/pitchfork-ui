import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './SectionHeader.css';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: React.ReactNode;
  heading: React.ReactNode;
  description?: React.ReactNode;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  divider?: boolean;
  align?: 'start' | 'between' | 'end';
}

export const SectionHeader = forwardRef<HTMLElement, SectionHeaderProps>(
  function SectionHeader(
    {
      className,
      eyebrow,
      heading,
      description,
      metadata,
      actions,
      divider = false,
      align = 'between',
      children,
      ...props
    },
    ref,
  ) {
  return (
    <header
      ref={ref}
      className={cx(
        'pf-section-header',
        divider && 'pf-section-header--divider',
        `pf-section-header--${align}`,
        className,
      )}
      {...props}
    >
      <div className="pf-section-header__content">
        {eyebrow ? (
          <p className="pf-section-header__eyebrow">{eyebrow}</p>
        ) : null}
        <h2 className="pf-section-header__heading">{heading}</h2>
        {description ? (
          <p className="pf-section-header__description">{description}</p>
        ) : null}
        {metadata ? (
          <div className="pf-section-header__metadata">{metadata}</div>
        ) : null}
        {children}
      </div>

      {actions ? (
        <div className="pf-section-header__actions">{actions}</div>
      ) : null}
    </header>
  );
});

SectionHeader.displayName = 'SectionHeader';
