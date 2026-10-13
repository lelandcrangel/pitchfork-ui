import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './ContentDivider.css';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-content-divider>`, or `PfContentDivider` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type ContentDividerOrientation = 'horizontal' | 'vertical';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-content-divider>`, or `PfContentDivider` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export interface ContentDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  orientation?: ContentDividerOrientation;
  inset?: boolean;
}

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-content-divider>`, or `PfContentDivider` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const ContentDivider = forwardRef<HTMLDivElement, ContentDividerProps>(
  ({ className, label, orientation = 'horizontal', inset = false, ...props }, ref) => {
    if (orientation === 'vertical') {
      return (
        <div
          ref={ref}
          {...props}
          className={cx(
            'pf-content-divider',
            'pf-content-divider--vertical',
            inset && 'pf-content-divider--inset',
            className,
          )}
          role="separator"
          aria-orientation="vertical"
        />
      );
    }

    return (
      <div
        ref={ref}
        {...props}
        className={cx('pf-content-divider', inset && 'pf-content-divider--inset', className)}
        role="separator"
        aria-orientation="horizontal"
      >
        {label ? (
          <>
            <span className="pf-content-divider__line" aria-hidden />
            <span className="pf-content-divider__label">{label}</span>
            <span className="pf-content-divider__line" aria-hidden />
          </>
        ) : (
          <span className="pf-content-divider__line" aria-hidden />
        )}
      </div>
    );
  },
);

ContentDivider.displayName = 'ContentDivider';
