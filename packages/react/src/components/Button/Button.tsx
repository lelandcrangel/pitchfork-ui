import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './Button.css';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-button>`, or `PfButton` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-button>`, or `PfButton` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-button>`, or `PfButton` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

const Spinner = () => (
  <svg
    className="pf-button__spinner"
    viewBox="0 0 24 24"
    fill="none"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeDasharray="32"
      strokeDashoffset="8"
    />
  </svg>
);

/** @deprecated `@pitchfork-ui/react` is deprecated. Use `<pf-button>`, or `PfButton` from `@pitchfork-ui/elements-react`. See Foundations → Migrating. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      type = 'button',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cx(
          'pf-button',
          `pf-button--${variant}`,
          `pf-button--${size}`,
          fullWidth && 'pf-button--full',
          loading && 'pf-button--loading',
          className,
        )}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
