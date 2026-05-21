import { forwardRef, useId } from 'react';
import { cx } from '../../utils/cx';
import './Switch.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ id, label, className, ...props }, ref) => {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className="pf-switch-field">
      <input ref={ref} id={switchId} type="checkbox" role="switch" className={cx('pf-switch', className)} {...props} />
      {label ? <label htmlFor={switchId}>{label}</label> : null}
    </div>
  );
});
Switch.displayName = 'Switch';
