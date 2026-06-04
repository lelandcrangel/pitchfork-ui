import { forwardRef, useId } from 'react';
import { FieldWrapper } from '../../utils/FieldWrapper';
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
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <FieldWrapper
        labelFor={textareaId}
        label={label}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        required={props.required}
      >
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cx('pf-textarea', error && 'pf-textarea--invalid', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
      </FieldWrapper>
    );
  },
);

Textarea.displayName = 'Textarea';
