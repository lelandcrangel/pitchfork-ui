import { forwardRef } from 'react';
import { cx } from './cx';

interface FieldWrapperProps {
  labelFor: string;
  label?: string;
  description?: string;
  descriptionId?: string;
  error?: string;
  errorId?: string;
  required?: boolean;
  children: React.ReactNode;
  /** Rendered after the error message — for component-specific trailing content. */
  footer?: React.ReactNode;
  className?: string;
}

export const FieldWrapper = forwardRef<HTMLDivElement, FieldWrapperProps>(
  (
    {
      labelFor,
      label,
      description,
      descriptionId,
      error,
      errorId,
      required,
      children,
      footer,
      className,
    },
    ref,
  ) => (
    <div ref={ref} className={cx('pf-field', className)}>
      {label ? (
        <label className="pf-field__label" id={`${labelFor}-label`} htmlFor={labelFor}>
          {label}
          {required && (
            <span className="pf-field__required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      ) : null}
      {children}
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
      {footer}
    </div>
  ),
);

FieldWrapper.displayName = 'FieldWrapper';
