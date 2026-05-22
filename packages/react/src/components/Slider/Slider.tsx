import { forwardRef, useId, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import './Slider.css';

export interface SliderProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'value' | 'defaultValue' | 'onChange'
  > {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  label?: string;
  description?: string;
  error?: string;
  showValue?: boolean;
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      id,
      value,
      defaultValue,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      label,
      description,
      error,
      showValue = true,
      className,
      disabled,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const sliderId = id ?? generatedId;
    const descriptionId = description ? `${sliderId}-description` : undefined;
    const errorId = error ? `${sliderId}-error` : undefined;
    const describedBy =
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
      undefined;

    const minNumber = Number(min);
    const maxNumber = Number(max);
    const stepNumber = Number(step);
    const safeMin = Number.isFinite(minNumber) ? minNumber : 0;
    const safeMax = Number.isFinite(maxNumber) ? maxNumber : safeMin + 100;
    const normalizedMax = safeMax >= safeMin ? safeMax : safeMin;
    const normalizedStep = Number.isFinite(stepNumber) && stepNumber > 0
      ? stepNumber
      : 1;

    const isControlled = value !== undefined;
    const initialValue = clamp(
      defaultValue ?? safeMin,
      safeMin,
      normalizedMax,
    );
    const [internalValue, setInternalValue] = useState(initialValue);
    const currentValue = clamp(
      isControlled ? value ?? safeMin : internalValue,
      safeMin,
      normalizedMax,
    );

    const progressPercent = useMemo(() => {
      const range = normalizedMax - safeMin;
      if (range <= 0) {
        return 0;
      }
      return ((currentValue - safeMin) / range) * 100;
    }, [currentValue, normalizedMax, safeMin]);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      const nextValue = Number(event.target.value);
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    };

    return (
      <div className="pf-field">
        {(label || showValue) ? (
          <div className="pf-slider__header">
            {label ? (
              <label className="pf-field__label" htmlFor={sliderId}>
                {label}
              </label>
            ) : (
              <span />
            )}
            {showValue ? (
              <span className="pf-slider__value" aria-hidden>
                {Math.round(currentValue)}
              </span>
            ) : null}
          </div>
        ) : null}

        <input
          {...props}
          ref={ref}
          id={sliderId}
          type="range"
          value={currentValue}
          min={safeMin}
          max={normalizedMax}
          step={normalizedStep}
          disabled={disabled}
          className={cx('pf-slider', error && 'pf-slider--invalid', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={handleChange}
          style={{ '--pf-slider-progress': `${progressPercent}%` } as React.CSSProperties}
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

Slider.displayName = 'Slider';
