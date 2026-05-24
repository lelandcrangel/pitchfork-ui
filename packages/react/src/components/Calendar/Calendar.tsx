import { useEffect, useId, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Calendar.css';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => {
  const date = new Date(2024, month, 1);
  const label = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
    date,
  );
  return { value: month, label };
});

const toMidday = (date: Date) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next;
};

const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
};

const addMonths = (date: Date, amount: number) => {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12);
};

const buildCalendarDays = (monthDate: Date) => {
  const monthStart = startOfMonth(monthDate);
  const firstWeekday = monthStart.getDay();
  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    monthStart.getDate() - firstWeekday,
    12,
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
      12,
    );

    return {
      date,
      inCurrentMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
};

export interface CalendarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue'
> {
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

export function Calendar({
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
}: CalendarProps) {
  const generatedId = useId();
  const calendarId = props.id ?? generatedId;
  const descriptionId = description ? `${calendarId}-description` : undefined;
  const errorId = error ? `${calendarId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
    undefined;

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(
    defaultValue
      ? toMidday(defaultValue)
      : autoSelectToday
        ? toMidday(new Date())
        : undefined,
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

    setDisplayMonth(clampToYearRange(startOfMonth(selectedDate)));
  }, [selectedDate, yearRange.end, yearRange.start]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(displayMonth);
  }, [displayMonth]);

  const yearOptions = useMemo(() => {
    const length = yearRange.end - yearRange.start + 1;
    return Array.from({ length }, (_, index) => yearRange.start + index);
  }, [yearRange.end, yearRange.start]);

  const isPrevMonthDisabled =
    displayMonth.getFullYear() === yearRange.start &&
    displayMonth.getMonth() === 0;
  const isNextMonthDisabled =
    displayMonth.getFullYear() === yearRange.end &&
    displayMonth.getMonth() === 11;

  const dayItems = useMemo(() => {
    return buildCalendarDays(displayMonth);
  }, [displayMonth]);

  const today = useMemo(() => toMidday(new Date()), []);

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
        {...props}
        id={calendarId}
        className={cx(
          'pf-calendar',
          error && 'pf-calendar--invalid',
          className,
        )}
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
              setDisplayMonth((current) =>
                clampToYearRange(addMonths(current, -1)),
              );
            }}
          >
            <Icon name="square-caret-left" aria-hidden />
          </button>

          <div className="pf-calendar__month-controls">
            <label
              className="pf-calendar__control-label"
              htmlFor={`${calendarId}-month`}
            >
              Month
            </label>
            <select
              id={`${calendarId}-month`}
              className="pf-calendar__control"
              value={displayMonth.getMonth()}
              aria-label="Select month"
              onChange={(event) => {
                const nextMonth = Number(event.target.value);
                setDisplayMonth((current) =>
                  clampToYearRange(
                    new Date(current.getFullYear(), nextMonth, 1, 12),
                  ),
                );
              }}
            >
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>

            <label
              className="pf-calendar__control-label"
              htmlFor={`${calendarId}-year`}
            >
              Year
            </label>
            <select
              id={`${calendarId}-year`}
              className="pf-calendar__control"
              value={displayMonth.getFullYear()}
              aria-label="Select year"
              onChange={(event) => {
                const nextYear = Number(event.target.value);
                setDisplayMonth((current) =>
                  clampToYearRange(
                    new Date(nextYear, current.getMonth(), 1, 12),
                  ),
                );
              }}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="pf-calendar__nav"
            aria-label="Next month"
            disabled={isNextMonthDisabled}
            onClick={() => {
              setDisplayMonth((current) =>
                clampToYearRange(addMonths(current, 1)),
              );
            }}
          >
            <Icon name="square-caret-right" aria-hidden />
          </button>
        </div>

        <div className="pf-calendar__weekday-row" aria-hidden>
          {WEEKDAY_LABELS.map((day) => (
            <span key={day} className="pf-calendar__weekday">
              {day}
            </span>
          ))}
        </div>

        <div className="pf-calendar__grid" role="grid" aria-label={monthLabel}>
          {dayItems.map(({ date, inCurrentMonth }) => {
            const isSelected = selectedDate
              ? isSameDay(selectedDate, date)
              : false;
            const isToday = isSameDay(today, date);
            const isDisabled = Boolean(disabledDates?.(date));

            if (!showOutsideDays && !inCurrentMonth) {
              return (
                <span
                  key={date.toISOString()}
                  className="pf-calendar__day-empty"
                  aria-hidden
                />
              );
            }

            return (
              <button
                key={date.toISOString()}
                type="button"
                role="gridcell"
                className={cx(
                  'pf-calendar__day',
                  !inCurrentMonth && 'pf-calendar__day--outside',
                  isToday && 'pf-calendar__day--today',
                  isSelected && 'pf-calendar__day--selected',
                )}
                aria-selected={isSelected}
                disabled={isDisabled}
                onClick={() => {
                  selectDate(date);
                }}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
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
