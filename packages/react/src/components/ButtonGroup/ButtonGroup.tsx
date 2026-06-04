import { forwardRef, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import './ButtonGroup.css';

export interface ButtonGroupItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  dot?: boolean;
}

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: ButtonGroupItem[];
  value?: string | string[];
  defaultValue?: string | string[];
  multiple?: boolean;
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}

const isSelected = (
  currentValue: string | string[] | undefined,
  itemValue: string,
  multiple: boolean,
) => {
  if (multiple) {
    return Array.isArray(currentValue) ? currentValue.includes(itemValue) : false;
  }

  return currentValue === itemValue;
};

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      items,
      value,
      defaultValue,
      multiple = false,
      onValueChange,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string | string[] | undefined>(defaultValue);
    const selectedValue = isControlled ? value : internalValue;

    const selectedSet = useMemo(() => {
      if (!multiple) {
        return new Set(typeof selectedValue === 'string' ? [selectedValue] : []);
      }

      return new Set(Array.isArray(selectedValue) ? selectedValue : []);
    }, [multiple, selectedValue]);

    const handleSelect = (itemValue: string) => {
      if (disabled) {
        return;
      }

      if (multiple) {
        const nextValue = selectedSet.has(itemValue)
          ? [...selectedSet].filter((currentItem) => currentItem !== itemValue)
          : [...selectedSet, itemValue];

        if (!isControlled) {
          setInternalValue(nextValue);
        }
        onValueChange?.(nextValue);
        return;
      }

      if (!isControlled) {
        setInternalValue(itemValue);
      }
      onValueChange?.(itemValue);
    };

    return (
      <div ref={ref} className={cx('pf-button-group', className)} role="group" {...props}>
        {items.map((item) => {
          const selected = isSelected(selectedValue, item.value, multiple);
          const isDisabled = disabled || item.disabled;

          return (
            <button
              key={item.value}
              type="button"
              className={cx(
                'pf-button-group__button',
                selected && 'pf-button-group__button--selected',
              )}
              aria-pressed={selected}
              disabled={isDisabled}
              onClick={() => handleSelect(item.value)}
            >
              {item.icon ? (
                <span aria-hidden className="pf-button-group__icon">
                  {item.icon}
                </span>
              ) : null}
              {item.dot ? <span aria-hidden className="pf-button-group__dot" /> : null}
              <span className="pf-button-group__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  },
);

ButtonGroup.displayName = 'ButtonGroup';
