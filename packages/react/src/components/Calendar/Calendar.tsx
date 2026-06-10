import { Dropdown } from '../Dropdown';
import { forwardRef, useEffect, useId, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Calendar.css';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, month) => {
  const date = new Date(2024, month, 1);
  const label = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
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
    displayMonth.getFullYear() === yearRange.start && displayMonth.getMonth() === 0;
  const isNextMonthDisabled =
    displayMonth.getFullYear() === yearRange.end && displayMonth.getMonth() === 11;

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

        <div className="pf-calendar__grid" role="grid" aria-label={monthLabel}>
          {/* Column headers — display:contents keeps the CSS grid layout intact */}
          <div role="row" style={{ display: 'contents' }} aria-hidden>
            {WEEKDAY_LABELS.map((day) => (
              <span key={day} role="columnheader" className="pf-calendar__weekday">
                {day}
              </span>
            ))}
          </div>

          {/* Week rows — 6 rows of 7 days */}
          {Array.from({ length: 6 }, (_, week) => (
            <div key={week} role="row" style={{ display: 'contents' }}>
              {dayItems.slice(week * 7, (week + 1) * 7).map(({ date, inCurrentMonth }) => {
                const isSelected = selectedDate ? isSameDay(selectedDate, date) : false;
                const isToday = isSameDay(today, date);
                const isDisabled = Boolean(disabledDates?.(date));

                if (!showOutsideDays && !inCurrentMonth) {
                  return (
                    <span key={date.toISOString()} className="pf-calendar__day-empty" aria-hidden />
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
                    aria-label={new Intl.DateTimeFormat('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(date)}
                    aria-selected={isSelected}
                    aria-current={isToday ? 'date' : undefined}
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
          ))}
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
});

Calendar.displayName = 'Calendar';
