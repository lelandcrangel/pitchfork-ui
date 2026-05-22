import { cx } from '../../utils/cx';
import './ContentDivider.css';

export type ContentDividerOrientation = 'horizontal' | 'vertical';

export interface ContentDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  orientation?: ContentDividerOrientation;
  inset?: boolean;
}

export function ContentDivider({
  className,
  label,
  orientation = 'horizontal',
  inset = false,
  ...props
}: ContentDividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
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
      {...props}
      className={cx(
        'pf-content-divider',
        inset && 'pf-content-divider--inset',
        className,
      )}
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
}
