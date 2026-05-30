import { forwardRef, useId } from 'react';
import { cx } from '../../utils/cx';
import './Textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      id,
      label,
      description,
      error,
      className,
      'aria-describedby': ariaDescribedBy,
      rows = 4,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const descriptionId = description ? `${textareaId}-description` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy =
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
      undefined;

    return (
      <div className="pf-field">
        {label ? (
          <label className="pf-field__label" htmlFor={textareaId}>
            {label}
            {props.required && <span className="pf-field__required" aria-hidden="true">*</span>}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cx(
            'pf-textarea',
            error && 'pf-textarea--invalid',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
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

Textarea.displayName = 'Textarea';
