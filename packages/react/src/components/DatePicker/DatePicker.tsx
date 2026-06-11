import { forwardRef, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { composeDescribedBy, Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useDisclosure,
  useFocusTrap,
  useOutsideInteraction,
} from '../../hooks';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { cx } from '../../utils/cx';
import { Calendar } from '../Calendar';
import { Icon } from '../Icon';
import './DatePicker.css';

const toMidday = (date: Date) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
};

export interface DatePickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue'
> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (value: Date | undefined) => void;
  label?: string;
  description?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  disabledDates?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  startYear?: number;
  endYear?: number;
}

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(function DatePicker(
  {
    id,
    className,
    value,
    defaultValue,
    onValueChange,
    label,
    description,
    error,
    placeholder = 'Select a date',
    required = false,
    disabled = false,
    allowClear = false,
    disabledDates,
    showOutsideDays = true,
    startYear,
    endYear,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const descriptionId = description ? `${pickerId}-description` : undefined;
  const errorId = error ? `${pickerId}-error` : undefined;
  const describedBy = composeDescribedBy(ariaDescribedBy, descriptionId, errorId);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(
    defaultValue ? toMidday(defaultValue) : undefined,
  );
  const selectedDate = isControlled ? (value ? toMidday(value) : undefined) : internalValue;

  const disclosure = useDisclosure({ disabled });
  const { isOpen } = disclosure;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverStyle = useAnchoredPosition({
    anchorRef: triggerRef,
    floatingRef: popoverRef,
    enabled: isOpen,
    flip: true,
    matchAnchorWidth: false,
  });

  useOutsideInteraction({
    refs: [rootRef, popoverRef],
    enabled: isOpen,
    eventName: 'mousedown',
    onInteractOutside: disclosure.close,
  });

  useFocusTrap({
    containerRef: popoverRef,
    enabled: isOpen,
    onEscape: disclosure.close,
  });

  const formattedDate = useMemo(() => {
    if (!selectedDate) {
      return '';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(selectedDate);
  }, [selectedDate]);

  const selectDate = (nextDate: Date) => {
    const normalized = toMidday(nextDate);

    if (!isControlled) {
      setInternalValue(normalized);
    }

    onValueChange?.(normalized);
    disclosure.close();
  };

  const clearDate = () => {
    if (!isControlled) {
      setInternalValue(undefined);
    }

    onValueChange?.(undefined);
  };

  return (
    <FieldWrapper
      ref={rootRef}
      labelFor={`${pickerId}-trigger`}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      required={required}
    >
      <div
        ref={ref}
        {...props}
        id={pickerId}
        className={cx('pf-date-picker', className)}
        aria-describedby={describedBy}
      >
        <div className="pf-date-picker__control-row">
          {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- aria-invalid/aria-required on a dialog-opener trigger is a known form-field pattern; combobox role is not appropriate here because aria-controls would reference a conditionally-rendered portal that axe can't reliably resolve */}
          <button
            ref={triggerRef}
            id={`${pickerId}-trigger`}
            type="button"
            className={cx('pf-date-picker__trigger', error && 'pf-date-picker__trigger--invalid')}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-required={required || undefined}
            onClick={() => {
              disclosure.toggle();
            }}
            onKeyDown={(event) => {
              if (event.key === Keys.Escape) {
                disclosure.close();
              }
            }}
          >
            <span
              className={cx(
                'pf-date-picker__value',
                !selectedDate && 'pf-date-picker__value--placeholder',
              )}
            >
              {formattedDate || placeholder}
            </span>
            <Icon name="calendar" aria-hidden />
          </button>

          {allowClear && selectedDate ? (
            <button
              type="button"
              className="pf-date-picker__icon-button"
              aria-label="Clear selected date"
              disabled={disabled}
              onClick={clearDate}
            >
              <Icon name="circle-xmark" aria-hidden />
            </button>
          ) : null}
        </div>

        {isOpen && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={popoverRef}
                className="pf-date-picker__popover"
                role="dialog"
                aria-label="Date picker calendar"
                style={popoverStyle}
              >
                <Calendar
                  value={selectedDate}
                  onValueChange={selectDate}
                  disabledDates={disabledDates}
                  showOutsideDays={showOutsideDays}
                  startYear={startYear}
                  endYear={endYear}
                />
              </div>,
              document.body,
            )
          : null}
      </div>
    </FieldWrapper>
  );
});

DatePicker.displayName = 'DatePicker';
