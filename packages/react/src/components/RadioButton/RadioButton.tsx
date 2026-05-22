import { forwardRef, useId } from 'react';
import { cx } from '../../utils/cx';
import './RadioButton.css';

export interface RadioButtonProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label?: string;
}

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(
  ({ id, label, className, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id ?? generatedId;

    return (
      <div className="pf-radio-field">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          className={cx('pf-radio', className)}
          {...props}
        />
        {label ? <label htmlFor={radioId}>{label}</label> : null}
      </div>
    );
  },
);

RadioButton.displayName = 'RadioButton';
