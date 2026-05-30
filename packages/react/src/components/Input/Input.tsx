import { forwardRef, useId } from 'react';
import { cx } from '../../utils/cx';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      description,
      error,
      className,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy =
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
      undefined;

    return (
      <div className="pf-field">
        {label ? (
          <label className="pf-field__label" htmlFor={inputId}>
            {label}
            {props.required && <span className="pf-field__required" aria-hidden="true">*</span>}
          </label>
        ) : null}
        <input
          {...props}
          ref={ref}
          id={inputId}
          className={cx('pf-input', error && 'pf-input--invalid', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {description ? (
          <p className="pf-field__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="pf-field__error" id={errorId}>
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
