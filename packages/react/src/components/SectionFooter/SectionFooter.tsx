import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './SectionFooter.css';

export interface SectionFooterProps extends React.HTMLAttributes<HTMLElement> {
  heading?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  divider?: boolean;
  align?: 'start' | 'between' | 'end';
}

export const SectionFooter = forwardRef<HTMLElement, SectionFooterProps>(function SectionFooter(
  {
    className,
    heading,
    description,
    actions,
    divider = true,
    align = 'between',
    children,
    ...props
  },
  ref,
) {
  return (
    <footer
      ref={ref}
      className={cx(
        'pf-section-footer',
        divider && 'pf-section-footer--divider',
        `pf-section-footer--${align}`,
        className,
      )}
      {...props}
    >
      <div className="pf-section-footer__content">
        {heading ? <h3 className="pf-section-footer__heading">{heading}</h3> : null}
        {description ? <p className="pf-section-footer__description">{description}</p> : null}
        {children}
      </div>

      {actions ? <div className="pf-section-footer__actions">{actions}</div> : null}
    </footer>
  );
});

SectionFooter.displayName = 'SectionFooter';
