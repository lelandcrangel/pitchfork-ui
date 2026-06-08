import { forwardRef, useId, useRef, useState } from 'react';
import { composeDescribedBy, Keys } from '../../a11y';
import { useComposedRefs, useControllableState } from '../../hooks';
import { cx } from '../../utils/cx';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { Icon } from '../Icon';
import './NumberInput.css';

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max' | 'step'
> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  description?: string;
  error?: string;
  /** Intl.NumberFormat options applied to the value while the field is not focused. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Locale(s) for formatting. Defaults to the runtime default. */
  locale?: string | string[];
  decrementLabel?: string;
  incrementLabel?: string;
  name?: string;
}

const decimalsOf = (n: number) => {
  const str = String(n);
  const dot = str.indexOf('.');
  return dot === -1 ? 0 : str.length - dot - 1;
};

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  {
    id,
    value,
    defaultValue,
    onValueChange,
    min = -Infinity,
    max = Infinity,
    step = 1,
    label,
    description,
    error,
    formatOptions,
    locale,
    decrementLabel = 'Decrease',
    incrementLabel = 'Increase',
    name,
    required,
    disabled,
    className,
    placeholder,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = composeDescribedBy(ariaDescribedBy, descriptionId, errorId);

  const [rawValue, setCurrentValue] = useControllableState<number | null>({
    value,
    defaultValue: defaultValue ?? null,
    onChange: onValueChange,
  });
  const currentValue: number | null = rawValue ?? null;

  const inputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useComposedRefs(inputRef, ref);

  const stepDecimals = decimalsOf(step);
  const round = (n: number) => {
    const factor = 10 ** stepDecimals;
    return Math.round(n * factor) / factor;
  };

  const formatValue = (n: number | null) => {
    if (n === null) return '';
    if (formatOptions) {
      return new Intl.NumberFormat(locale, formatOptions).format(n);
    }
    return String(n);
  };

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatValue(currentValue));

  // While focused the field shows the editable draft; otherwise the formatted value.
  const displayValue = focused ? draft : formatValue(currentValue);

  const commit = (next: number | null) => {
    if (next === null) {
      setCurrentValue(null);
      setDraft('');
      return;
    }
    const clamped = round(clamp(next, min, max));
    setCurrentValue(clamped);
    setDraft(focused ? String(clamped) : formatValue(clamped));
  };

  const stepBy = (direction: 1 | -1) => {
    if (disabled) return;
    // Step from the current value, or from a sensible bound when empty.
    const start = currentValue ?? (Number.isFinite(min) ? min : Number.isFinite(max) ? max : 0);
    commit(start + direction * step);
  };

  const atMin = currentValue !== null && currentValue <= min;
  const atMax = currentValue !== null && currentValue >= max;

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;
    if (event.key === Keys.ArrowUp) {
      event.preventDefault();
      stepBy(1);
    } else if (event.key === Keys.ArrowDown) {
      event.preventDefault();
      stepBy(-1);
    } else if (event.key === Keys.Home && Number.isFinite(min)) {
      event.preventDefault();
      commit(min);
    } else if (event.key === Keys.End && Number.isFinite(max)) {
      event.preventDefault();
      commit(max);
    }
  };

  return (
    <FieldWrapper
      labelFor={fieldId}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      required={required}
    >
      <div className={cx('pf-numberinput', error && 'pf-numberinput--invalid')}>
        <button
          type="button"
          className="pf-numberinput__step pf-numberinput__step--decrement"
          aria-label={decrementLabel}
          disabled={disabled || atMin}
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => stepBy(-1)}
        >
          <Icon name="minus" aria-hidden />
        </button>

        <input
          {...props}
          id={fieldId}
          ref={inputRefs}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          className={cx('pf-numberinput__input', className)}
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-valuenow={currentValue ?? undefined}
          aria-valuemin={Number.isFinite(min) ? min : undefined}
          aria-valuemax={Number.isFinite(max) ? max : undefined}
          onFocus={() => {
            setFocused(true);
            setDraft(currentValue === null ? '' : String(currentValue));
          }}
          onChange={(event) => {
            const raw = event.target.value;
            setDraft(raw);
            if (raw.trim() === '') {
              setCurrentValue(null);
              return;
            }
            const parsed = Number(raw);
            if (!Number.isNaN(parsed)) {
              setCurrentValue(round(clamp(parsed, min, max)));
            }
          }}
          onBlur={() => {
            setFocused(false);
            // Re-clamp and normalise the draft on blur.
            if (draft.trim() === '') {
              commit(null);
            } else {
              const parsed = Number(draft);
              commit(Number.isNaN(parsed) ? currentValue : parsed);
            }
          }}
          onKeyDown={onKeyDown}
        />

        <button
          type="button"
          className="pf-numberinput__step pf-numberinput__step--increment"
          aria-label={incrementLabel}
          disabled={disabled || atMax}
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => stepBy(1)}
        >
          <Icon name="plus" aria-hidden />
        </button>

        {name ? <input type="hidden" name={name} value={currentValue ?? ''} /> : null}
      </div>
    </FieldWrapper>
  );
});

NumberInput.displayName = 'NumberInput';
