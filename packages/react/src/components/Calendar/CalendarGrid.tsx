import { useMemo } from 'react';
import { cx } from '../../utils/cx';
import { WEEKDAY_LABELS, buildCalendarDays, isSameDay, toMidday } from './dateUtils';

/* Shared month grid for Calendar (single date) and DateRangePicker (range).
   Internal — not part of the public package API. */

export interface CalendarDayState {
  /** Single-date selection (Calendar). */
  selected?: boolean;
  /** Range endpoints / interior (DateRangePicker). */
  rangeStart?: boolean;
  rangeEnd?: boolean;
  inRange?: boolean;
}

export interface CalendarGridProps {
  monthDate: Date;
  /** BEM block the grid classes hang off ('pf-calendar' or 'pf-daterange'). */
  classPrefix: string;
  getDayState: (date: Date) => CalendarDayState;
  onDayClick: (date: Date) => void;
  onDayHover?: (date: Date | null) => void;
  disabledDates?: (date: Date) => boolean;
  showOutsideDays?: boolean;
}

export function CalendarGrid({
  monthDate,
  classPrefix,
  getDayState,
  onDayClick,
  onDayHover,
  disabledDates,
  showOutsideDays = true,
}: CalendarGridProps) {
  const dayItems = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const today = useMemo(() => toMidday(new Date()), []);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(monthDate);
  }, [monthDate]);

  return (
    <div className={`${classPrefix}__grid`} role="grid" aria-label={monthLabel}>
      {/* Column headers — display:contents keeps the CSS grid layout intact */}
      <div role="row" style={{ display: 'contents' }} aria-hidden>
        {WEEKDAY_LABELS.map((day) => (
          <span key={day} role="columnheader" className={`${classPrefix}__weekday`}>
            {day}
          </span>
        ))}
      </div>

      {/* Week rows — 6 rows of 7 days */}
      {Array.from({ length: 6 }, (_, week) => (
        <div key={week} role="row" style={{ display: 'contents' }}>
          {dayItems.slice(week * 7, (week + 1) * 7).map(({ date, inCurrentMonth }) => {
            const state = getDayState(date);
            const isToday = isSameDay(today, date);
            const isEndpoint = Boolean(state.selected || state.rangeStart || state.rangeEnd);
            const isDisabled = Boolean(disabledDates?.(date));

            if (!showOutsideDays && !inCurrentMonth) {
              return (
                <span
                  key={date.toISOString()}
                  className={`${classPrefix}__day-empty`}
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
                  `${classPrefix}__day`,
                  !inCurrentMonth && `${classPrefix}__day--outside`,
                  isToday && `${classPrefix}__day--today`,
                  isEndpoint && `${classPrefix}__day--selected`,
                  state.rangeStart && `${classPrefix}__day--range-start`,
                  state.rangeEnd && `${classPrefix}__day--range-end`,
                  state.inRange && `${classPrefix}__day--in-range`,
                )}
                aria-label={new Intl.DateTimeFormat('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }).format(date)}
                aria-selected={isEndpoint || Boolean(state.inRange)}
                aria-current={isToday ? 'date' : undefined}
                disabled={isDisabled}
                onClick={() => {
                  onDayClick(date);
                }}
                onMouseEnter={onDayHover ? () => onDayHover(date) : undefined}
                onMouseLeave={onDayHover ? () => onDayHover(null) : undefined}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
