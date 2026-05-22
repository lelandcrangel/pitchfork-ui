import { forwardRef, useId, useState } from 'react';
import { cx } from '../../utils/cx';
import './RadioGroup.css';

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  name?: string;
  legend?: string;
  options: RadioGroupOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: 'vertical' | 'horizontal';
}

export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  (
    {
      name,
      legend,
      options,
      value,
      defaultValue,
      onValueChange,
      disabled = false,
      orientation = 'vertical',
      className,
      ...props
    },
    ref,
  ) => {
    const generatedName = useId();
    const groupName = name ?? generatedName;
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
    const selectedValue = isControlled ? value : internalValue;

    const handleChange = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue);
    };

    return (
      <fieldset
        ref={ref}
        className={cx(
          'pf-radio-group',
          orientation === 'horizontal' && 'pf-radio-group--horizontal',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {legend ? <legend className="pf-radio-group__legend">{legend}</legend> : null}
        {options.map((option) => {
          const optionId = `${groupName}-${option.value}`;
          const checked = selectedValue === option.value;
          const optionDisabled = disabled || option.disabled;

          return (
            <div key={option.value} className="pf-radio-group__item">
              <input
                id={optionId}
                className="pf-radio-group__input"
                type="radio"
                name={groupName}
                value={option.value}
                checked={checked}
                disabled={optionDisabled}
                onChange={() => handleChange(option.value)}
              />
              <label htmlFor={optionId} className="pf-radio-group__label">
                <span className="pf-radio-group__label-text">{option.label}</span>
                {option.description ? (
                  <span className="pf-radio-group__description">{option.description}</span>
                ) : null}
              </label>
            </div>
          );
        })}
      </fieldset>
    );
  },
);

RadioGroup.displayName = 'RadioGroup';
