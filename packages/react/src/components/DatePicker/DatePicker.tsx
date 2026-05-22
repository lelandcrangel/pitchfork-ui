import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  disabled?: boolean;
  allowClear?: boolean;
  disabledDates?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  startYear?: number;
  endYear?: number;
}

export function DatePicker({
  id,
  className,
  value,
  defaultValue,
  onValueChange,
  label,
  description,
  error,
  placeholder = 'Select a date',
  disabled = false,
  allowClear = false,
  disabledDates,
  showOutsideDays = true,
  startYear,
  endYear,
  'aria-describedby': ariaDescribedBy,
  ...props
}: DatePickerProps) {
  const generatedId = useId();
  const pickerId = id ?? generatedId;
  const descriptionId = description ? `${pickerId}-description` : undefined;
  const errorId = error ? `${pickerId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
    undefined;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(
    defaultValue ? toMidday(defaultValue) : undefined,
  );
  const selectedDate = isControlled
    ? value
      ? toMidday(value)
      : undefined
    : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePopoverPosition = () => {
      if (!triggerRef.current || !popoverRef.current) {
        return;
      }

      const viewportPadding = 8;
      const offset = 8;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let left = triggerRect.left;
      const minLeft = viewportPadding;
      const maxLeft = window.innerWidth - viewportPadding - popoverRect.width;

      if (maxLeft >= minLeft) {
        left = Math.min(Math.max(left, minLeft), maxLeft);
      } else {
        left = minLeft;
      }

      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const canOpenBelow =
        spaceBelow >= popoverRect.height + offset + viewportPadding;

      let top = canOpenBelow
        ? triggerRect.bottom + offset
        : triggerRect.top - popoverRect.height - offset;

      const minTop = viewportPadding;
      const maxTop = window.innerHeight - viewportPadding - popoverRect.height;

      if (maxTop >= minTop) {
        top = Math.min(Math.max(top, minTop), maxTop);
      } else {
        top = minTop;
      }

      setPopoverStyle({
        left,
        minWidth: triggerRect.width,
        top,
      });
    };

    updatePopoverPosition();
    window.addEventListener('resize', updatePopoverPosition);
    window.addEventListener('scroll', updatePopoverPosition, true);

    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInsideTrigger = Boolean(rootRef.current?.contains(target));
      const isInsidePopover = Boolean(popoverRef.current?.contains(target));

      if (!isInsideTrigger && !isInsidePopover) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

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
    setIsOpen(false);
  };

  const clearDate = () => {
    if (!isControlled) {
      setInternalValue(undefined);
    }

    onValueChange?.(undefined);
  };

  return (
    <div className="pf-field" ref={rootRef}>
      {label ? (
        <label className="pf-field__label" htmlFor={`${pickerId}-trigger`}>
          {label}
        </label>
      ) : null}

      <div
        {...props}
        id={pickerId}
        className={cx('pf-date-picker', className)}
        aria-describedby={describedBy}
      >
        <button
          ref={triggerRef}
          id={`${pickerId}-trigger`}
          type="button"
          className={cx(
            'pf-date-picker__trigger',
            error && 'pf-date-picker__trigger--invalid',
          )}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => {
            setIsOpen((current) => !current);
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

          <span className="pf-date-picker__icons">
            {allowClear && selectedDate ? (
              <span
                className="pf-date-picker__icon-button"
                role="button"
                aria-label="Clear selected date"
                onClick={(event) => {
                  event.stopPropagation();
                  clearDate();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    clearDate();
                  }
                }}
                tabIndex={0}
              >
                <Icon name="circle-xmark" aria-hidden />
              </span>
            ) : null}
            <Icon name="calendar" aria-hidden />
          </span>
        </button>

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
}
