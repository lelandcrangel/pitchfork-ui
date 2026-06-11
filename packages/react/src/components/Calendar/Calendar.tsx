import { Dropdown } from '../Dropdown';
import { forwardRef, useEffect, useId, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import { CalendarGrid } from './CalendarGrid';
import { addMonths, isSameDay, startOfMonth, toMidday } from './dateUtils';
import './Calendar.css';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => {
  const date = new Date(2024, month, 1);
  const label = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
  return { value: month, label };
});

export interface CalendarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (value: Date) => void;
  autoSelectToday?: boolean;
  label?: string;
  description?: string;
  error?: string;
  disabledDates?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  startYear?: number;
  endYear?: number;
}

export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
  {
    className,
    value,
    defaultValue,
    onValueChange,
    autoSelectToday = true,
    label,
    description,
    error,
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
  const calendarId = props.id ?? generatedId;
  const descriptionId = description ? `${calendarId}-description` : undefined;
  const errorId = error ? `${calendarId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') || undefined;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(
    defaultValue ? toMidday(defaultValue) : autoSelectToday ? toMidday(new Date()) : undefined,
  );
  const selectedDate = isControlled ? value : internalValue;

  const yearRange = useMemo(() => {
    const fallbackStart = new Date().getFullYear() - 50;
    const fallbackEnd = new Date().getFullYear() + 50;
    const nextStart = startYear ?? fallbackStart;
    const nextEnd = endYear ?? fallbackEnd;

    return {
      start: Math.min(nextStart, nextEnd),
      end: Math.max(nextStart, nextEnd),
    };
  }, [endYear, startYear]);

  const clampToYearRange = (date: Date) => {
    const year = date.getFullYear();

    if (year < yearRange.start) {
      return new Date(yearRange.start, 0, 1, 12);
    }

    if (year > yearRange.end) {
      return new Date(yearRange.end, 11, 1, 12);
    }

    return date;
  };

  const [displayMonth, setDisplayMonth] = useState<Date>(() => {
    const base = selectedDate ?? new Date();
    return clampToYearRange(startOfMonth(base));
  });

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    // Keep externally controlled values centered in the visible month.
    setDisplayMonth(clampToYearRange(startOfMonth(selectedDate)));
    // clampToYearRange is intentionally represented by the year bounds here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, yearRange.end, yearRange.start]);

  const yearOptions = useMemo(() => {
    const length = yearRange.end - yearRange.start + 1;
    return Array.from({ length }, (_, index) => yearRange.start + index);
  }, [yearRange.end, yearRange.start]);

  const isPrevMonthDisabled =
    displayMonth.getFullYear() === yearRange.start && displayMonth.getMonth() === 0;
  const isNextMonthDisabled =
    displayMonth.getFullYear() === yearRange.end && displayMonth.getMonth() === 11;

  const selectDate = (nextDate: Date) => {
    if (disabledDates?.(nextDate)) {
      return;
    }

    if (!isControlled) {
      setInternalValue(nextDate);
    }

    onValueChange?.(nextDate);
    setDisplayMonth(clampToYearRange(startOfMonth(nextDate)));
  };

  return (
    <div className="pf-field">
      {label ? (
        <label className="pf-field__label" htmlFor={calendarId}>
          {label}
        </label>
      ) : null}

      <div
        ref={ref}
        {...props}
        id={calendarId}
        className={cx('pf-calendar', error && 'pf-calendar--invalid', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      >
        <div className="pf-calendar__header">
          <button
            type="button"
            className="pf-calendar__nav"
            aria-label="Previous month"
            disabled={isPrevMonthDisabled}
            onClick={() => {
              setDisplayMonth((current) => clampToYearRange(addMonths(current, -1)));
            }}
          >
            <Icon name="square-caret-left" aria-hidden />
          </button>

          <div className="pf-calendar__month-controls">
            <span className="pf-calendar__control-label">Month</span>
            <Dropdown
              label={MONTH_OPTIONS[displayMonth.getMonth()].label}
              items={MONTH_OPTIONS.map((month) => ({
                id: String(month.value),
                label: month.label,
                onSelect: () => {
                  setDisplayMonth((current) =>
                    clampToYearRange(new Date(current.getFullYear(), month.value, 1, 12)),
                  );
                },
                disabled: false,
              }))}
              align="start"
            />

            <span className="pf-calendar__control-label">Year</span>
            <Dropdown
              label={String(displayMonth.getFullYear())}
              items={yearOptions.map((year) => ({
                id: String(year),
                label: String(year),
                onSelect: () => {
                  setDisplayMonth((current) =>
                    clampToYearRange(new Date(year, current.getMonth(), 1, 12)),
                  );
                },
                disabled: false,
              }))}
              align="start"
              maxVisibleItems={7}
            />
          </div>

          <button
            type="button"
            className="pf-calendar__nav"
            aria-label="Next month"
            disabled={isNextMonthDisabled}
            onClick={() => {
              setDisplayMonth((current) => clampToYearRange(addMonths(current, 1)));
            }}
          >
            <Icon name="square-caret-right" aria-hidden />
          </button>
        </div>

        <CalendarGrid
          monthDate={displayMonth}
          classPrefix="pf-calendar"
          getDayState={(date) => ({
            selected: selectedDate ? isSameDay(selectedDate, date) : false,
          })}
          onDayClick={selectDate}
          disabledDates={disabledDates}
          showOutsideDays={showOutsideDays}
        />
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
});

Calendar.displayName = 'Calendar';
