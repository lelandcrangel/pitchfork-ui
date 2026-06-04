import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './UtilityButton.css';

export type UtilityButtonVariant = 'neutral' | 'brand' | 'danger';
export type UtilityButtonSize = 'sm' | 'md';

export interface UtilityButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UtilityButtonVariant;
  size?: UtilityButtonSize;
  icon?: React.ReactNode;
  tooltip?: string;
}

export const UtilityButton = forwardRef<HTMLButtonElement, UtilityButtonProps>(
  (
    {
      className,
      variant = 'neutral',
      size = 'md',
      type = 'button',
      icon,
      children,
      tooltip,
      ...props
    },
    ref,
  ) => {
    if (process.env.NODE_ENV !== 'production') {
      if (!children && !props['aria-label'] && !props['aria-labelledby'] && !tooltip) {
        console.warn(
          '[UtilityButton] Provide an `aria-label`, `aria-labelledby`, or `tooltip` prop — this button has no visible text.',
        );
      }
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cx(
          'pf-utility-button',
          `pf-utility-button--${variant}`,
          `pf-utility-button--${size}`,
          className,
        )}
        title={tooltip}
        {...props}
      >
        {icon ? <span className="pf-utility-button__icon">{icon}</span> : null}
        {children ? <span className="pf-utility-button__label">{children}</span> : null}
      </button>
    );
  },
);

UtilityButton.displayName = 'UtilityButton';
