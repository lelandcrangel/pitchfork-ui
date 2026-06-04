import { forwardRef, useId } from 'react';
import { cx } from '../../utils/cx';
import './Checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, className, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id ?? generatedId;

    return (
      <div className="pf-checkbox-field">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cx('pf-checkbox', className)}
          {...props}
        />
        {label ? <label htmlFor={checkboxId}>{label}</label> : null}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
