import { useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { isActivationKey } from '../../a11y';
import {
  WEEKDAY_LABELS,
  buildCalendarDays,
  isSameDay,
  moveCalendarDate,
  resolveCalendarKey,
  startOfMonth,
  toMidday,
} from '@pitchfork-ui/core';

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
  /**
   * Shows another month, because the arrows walked out of this one. Without it
   * the keyboard stops at the month edge.
   */
  onMonthChange?: (month: Date) => void;
  /** The day the grid opens on, when it is not the first of the month. */
  initialFocusedDate?: Date;
}

/** The same day in another month, or that month's last day if it is shorter. */
const sameDayIn = (month: Date, day: number) => {
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12).getDate();
  return new Date(month.getFullYear(), month.getMonth(), Math.min(day, lastDay), 12);
};

const isSameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function CalendarGrid({
  monthDate,
  classPrefix,
  getDayState,
  onDayClick,
  onDayHover,
  disabledDates,
  showOutsideDays = true,
  onMonthChange,
  initialFocusedDate,
}: CalendarGridProps) {
  const dayItems = useMemo(() => buildCalendarDays(monthDate), [monthDate]);
  const today = useMemo(() => toMidday(new Date()), []);

  /*
   * One tab stop, not 42.
   *
   * This grid rendered 42 buttons and handled no keys at all, so reaching the
   * end of a month from its start took 42 presses of Tab and there was no way
   * to move by week. `<pf-calendar>` implements the ARIA grid pattern — one
   * tab stop on the focused day, arrows to move — and the arithmetic behind it
   * is core's `moveCalendarDate` and `resolveCalendarKey`, so the two layers
   * cannot disagree about what PageDown from the 31st of January means.
   */
  const [focusedDate, setFocusedDate] = useState(() =>
    initialFocusedDate && isSameMonth(initialFocusedDate, monthDate)
      ? toMidday(initialFocusedDate)
      : sameDayIn(monthDate, initialFocusedDate?.getDate() ?? 1),
  );

  const gridRef = useRef<HTMLDivElement>(null);
  // Set only by a keypress: focus follows the keyboard and never steals itself
  // back from elsewhere on the page on an unrelated re-render.
  const shouldRestoreFocus = useRef(false);

  /*
   * Both halves, always — and *derived* rather than synchronised, so there is
   * no render in between where the two disagree.
   *
   * Moving the month alone leaves the focused day on a date no longer
   * rendered, so no cell carries `tabIndex={0}` and the grid drops out of the
   * tab order altogether: reachable by mouse and by nothing else.
   * `pf-calendar`'s year picker shipped exactly that until a test went
   * looking. Reading the stored day through `monthDate` makes it impossible
   * here, and costs no effect — which an effect that calls `setState` would,
   * in cascading renders.
   */
  const activeDate = isSameMonth(focusedDate, monthDate)
    ? focusedDate
    : sameDayIn(monthDate, focusedDate.getDate());

  /*
   * After the arrows scroll the month the old button is gone, so focus has to
   * be applied once the new cells exist rather than in the handler.
   */
  useEffect(() => {
    if (!shouldRestoreFocus.current) return;
    shouldRestoreFocus.current = false;
    const cell = gridRef.current?.querySelector<HTMLButtonElement>('[data-pf-focused="true"]');
    cell?.focus();
  }, [focusedDate, monthDate]);

  /*
   * On the cells, not on the grid container. The container is a `role="grid"`
   * that never takes focus, and a key handler on a node that cannot be focused
   * is what `jsx-a11y/interactive-supports-focus` objects to — rightly, since
   * the thing a key arrives at here is always a day button.
   */
  const onDayKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
    const move = resolveCalendarKey(event.key);

    if (move) {
      event.preventDefault();
      /*
       * A disabled day can still be *focused*. Skipping it would make a long
       * blocked stretch impossible to cross, and the ARIA pattern is that
       * focus moves freely while activation is refused.
       */
      const next = moveCalendarDate(activeDate, move);
      shouldRestoreFocus.current = true;
      setFocusedDate(next);
      if (!isSameMonth(next, monthDate)) onMonthChange?.(startOfMonth(next));
      return;
    }

    if (isActivationKey(event.key)) {
      event.preventDefault();
      if (!disabledDates?.(activeDate)) onDayClick(activeDate);
      shouldRestoreFocus.current = true;
    }
  };

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(monthDate);
  }, [monthDate]);

  return (
    <div ref={gridRef} className={`${classPrefix}__grid`} role="grid" aria-label={monthLabel}>
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
            const isFocused = isSameDay(activeDate, date);

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
                /*
                 * `aria-disabled`, not `disabled`. The ARIA grid pattern is
                 * that focus crosses a blocked day while activation refuses
                 * it, and a `disabled` button cannot take focus at all -- so a
                 * long blocked stretch was uncrossable by keyboard. The
                 * stylesheets select on `[aria-disabled='true']` for the same
                 * reason, which is what `pf-calendar` has always done.
                 */
                aria-disabled={isDisabled || undefined}
                // The roving tab stop: 0 on the focused day, -1 on the other 41.
                tabIndex={isFocused ? 0 : -1}
                data-pf-focused={isFocused || undefined}
                onClick={() => {
                  setFocusedDate(date);
                  // An `aria-disabled` button still fires a click.
                  if (!isDisabled) onDayClick(date);
                }}
                onKeyDown={onDayKeyDown}
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
