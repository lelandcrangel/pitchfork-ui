import { forwardRef, useId } from 'react';
import { FieldWrapper } from '../../utils/FieldWrapper';
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
      <FieldWrapper
        labelFor={inputId}
        label={label}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        required={props.required}
      >
        <input
          {...props}
          ref={ref}
          id={inputId}
          className={cx('pf-input', error && 'pf-input--invalid', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      </FieldWrapper>
    );
  },
);

Input.displayName = 'Input';
