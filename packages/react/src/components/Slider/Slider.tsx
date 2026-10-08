import { clampToRange, getRangePercent, normalizeRange } from '@pitchfork-ui/core';
import { forwardRef, useId, useState } from 'react';
import { cx } from '../../utils/cx';
import './Slider.css';

export interface SliderProps extends Omit<
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
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    const {
      min: safeMin,
      max: normalizedMax,
      step: normalizedStep,
    } = normalizeRange(Number(min), Number(max), Number(step));

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(() =>
      clampToRange(defaultValue ?? safeMin, safeMin, normalizedMax),
    );
    const currentValue = clampToRange(
      isControlled ? (value ?? safeMin) : internalValue,
      safeMin,
      normalizedMax,
    );
    const progressPercent = getRangePercent(currentValue, safeMin, normalizedMax);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
      const nextValue = Number(event.target.value);
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    };

    return (
      <div className="pf-field">
        {label || showValue ? (
          <div className="pf-slider__header">
            {label ? (
              <label className="pf-field__label" htmlFor={sliderId}>
                {label}
                {props.required && (
                  <span className="pf-field__required" aria-hidden="true">
                    *
                  </span>
                )}
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
          style={
            {
              '--pf-slider-progress': `${progressPercent}%`,
            } as React.CSSProperties
          }
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
