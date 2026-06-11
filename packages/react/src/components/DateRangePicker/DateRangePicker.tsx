import { forwardRef, useCallback, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { composeDescribedBy, Keys } from '../../a11y';
import { useAnchoredPosition, useDisclosure, useOutsideInteraction } from '../../hooks';
import { cx } from '../../utils/cx';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { Icon } from '../Icon';
import { CalendarGrid } from '../Calendar/CalendarGrid';
import { addMonths, isSameDay, startOfMonth, toMidday } from '../Calendar/dateUtils';
import './DateRangePicker.css';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'defaultValue'
> {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange) => void;
  label?: string;
  description?: string;
  error?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  disabledDates?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  startYear?: number;
  endYear?: number;
}

// ─── date helpers ────────────────────────────────────────────────────────────
// Date math + the month grid itself are shared with Calendar (CalendarGrid).

const formatDate = (d: Date | null) => {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
};

// ─── mini calendar (inline, range-aware) ─────────────────────────────────────

interface RangeCalendarProps {
  monthDate: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoverDate: Date | null;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
  disabledDates?: (date: Date) => boolean;
  showOutsideDays?: boolean;
  isPrevDisabled?: boolean;
  isNextDisabled?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  /** Hide nav on desktop only (right panel — left panel controls both on wide screens). */
  hideNavDesktop?: boolean;
}

function RangeCalendar({
  monthDate,
  rangeStart,
  rangeEnd,
  hoverDate,
  onDayClick,
  onDayHover,
  disabledDates,
  showOutsideDays = true,
  isPrevDisabled,
  isNextDisabled,
  onPrev,
  onNext,
  hideNavDesktop = false,
}: RangeCalendarProps) {
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    monthDate,
  );

  // Effective end for hover preview: when only start is selected, hover extends range
  const effectiveEnd = rangeEnd ?? hoverDate;

  const isInRange = useCallback(
    (date: Date) => {
      if (!rangeStart || !effectiveEnd) return false;
      const lo = rangeStart <= effectiveEnd ? rangeStart : effectiveEnd;
      const hi = rangeStart <= effectiveEnd ? effectiveEnd : rangeStart;
      return date > lo && date < hi;
    },
    [rangeStart, effectiveEnd],
  );

  const isRangeStart = (date: Date) => !!rangeStart && isSameDay(date, rangeStart);
  const isRangeEnd = (date: Date) => {
    const end = rangeEnd ?? (hoverDate && rangeStart ? hoverDate : null);
    return !!end && isSameDay(date, end);
  };

  return (
    <div className="pf-daterange__calendar">
      <div
        className={cx(
          'pf-daterange__cal-header',
          hideNavDesktop && 'pf-daterange__cal-header--hide-nav-desktop',
        )}
      >
        <button
          type="button"
          className="pf-daterange__nav"
          aria-label="Previous month"
          disabled={isPrevDisabled}
          onClick={onPrev}
        >
          <Icon name="chevron-left" aria-hidden />
        </button>

        <span className="pf-daterange__cal-title">{monthLabel}</span>

        <button
          type="button"
          className="pf-daterange__nav"
          aria-label="Next month"
          disabled={isNextDisabled}
          onClick={onNext}
        >
          <Icon name="chevron-right" aria-hidden />
        </button>
      </div>

      <CalendarGrid
        monthDate={monthDate}
        classPrefix="pf-daterange"
        getDayState={(date) => ({
          rangeStart: isRangeStart(date),
          rangeEnd: isRangeEnd(date),
          inRange: isInRange(date),
        })}
        onDayClick={onDayClick}
        onDayHover={onDayHover}
        disabledDates={disabledDates}
        showOutsideDays={showOutsideDays}
      />
    </div>
  );
}

// ─── DateRangePicker ──────────────────────────────────────────────────────────

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      id,
      className,
      value,
      defaultValue,
      onValueChange,
      label,
      description,
      error,
      startPlaceholder = 'Start date',
      endPlaceholder = 'End date',
      required,
      disabled,
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
    const [internalRange, setInternalRange] = useState<DateRange>(
      defaultValue ?? { start: null, end: null },
    );
    const range = isControlled ? value : internalRange;

    const setRange = (next: DateRange) => {
      if (!isControlled) setInternalRange(next);
      onValueChange?.(next);
    };

    // Selecting: null = waiting for start, 'start' = start chosen, awaiting end
    const [selecting, setSelecting] = useState<'start' | null>(null);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);

    const yearRange = useMemo(() => {
      const fallbackStart = new Date().getFullYear() - 50;
      const fallbackEnd = new Date().getFullYear() + 50;
      return {
        start: startYear ?? fallbackStart,
        end: endYear ?? fallbackEnd,
      };
    }, [startYear, endYear]);

    const clampMonth = (d: Date) => {
      const y = d.getFullYear();
      if (y < yearRange.start) return new Date(yearRange.start, 0, 1, 12);
      if (y > yearRange.end) return new Date(yearRange.end, 11, 1, 12);
      return d;
    };

    const [leftMonth, setLeftMonth] = useState<Date>(() =>
      clampMonth(startOfMonth(range.start ?? new Date())),
    );
    const rightMonth = addMonths(leftMonth, 1);

    const disclosure = useDisclosure({ disabled });
    const { isOpen } = disclosure;
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const popoverStyle = useAnchoredPosition({
      anchorRef: rootRef,
      floatingRef: popoverRef,
      enabled: isOpen,
      flip: true,
      matchAnchorWidth: false,
    });

    useOutsideInteraction({
      refs: [rootRef, popoverRef],
      enabled: isOpen,
      eventName: 'mousedown',
      onInteractOutside: () => {
        setSelecting(null);
        setHoverDate(null);
        disclosure.close();
      },
    });

    const handleDayClick = (date: Date) => {
      if (selecting === null) {
        // First click — set start, clear end
        setRange({ start: toMidday(date), end: null });
        setSelecting('start');
      } else {
        // Second click — set end, close
        const start = range.start!;
        const end = toMidday(date);
        if (isSameDay(start, end)) {
          // Same day twice — reset
          setRange({ start: toMidday(date), end: null });
        } else if (end < start) {
          setRange({ start: end, end: start });
        } else {
          setRange({ start, end });
        }
        setSelecting(null);
        setHoverDate(null);
        disclosure.close();
      }
    };

    const clearRange = () => {
      setRange({ start: null, end: null });
      setSelecting(null);
      setHoverDate(null);
    };

    const isPrevDisabled =
      leftMonth.getFullYear() === yearRange.start && leftMonth.getMonth() === 0;
    const isNextDisabled =
      rightMonth.getFullYear() === yearRange.end && rightMonth.getMonth() === 11;

    const hasValue = range.start !== null || range.end !== null;
    const displayStart = formatDate(range.start);
    const displayEnd = formatDate(range.end);

    return (
      <FieldWrapper
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
          className={cx('pf-daterange', className)}
          aria-describedby={describedBy}
        >
          <div className="pf-daterange__control-row" ref={rootRef}>
            <button
              ref={triggerRef}
              id={`${pickerId}-trigger`}
              type="button"
              className={cx('pf-daterange__trigger', error && 'pf-daterange__trigger--invalid')}
              disabled={disabled}
              role="combobox"
              aria-invalid={error ? true : undefined}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-controls={isOpen ? `${pickerId}-dialog` : undefined}
              aria-required={required || undefined}
              onClick={() => {
                if (!isOpen) setSelecting(null);
                disclosure.toggle();
              }}
              onKeyDown={(e) => {
                if (e.key === Keys.Escape) disclosure.close();
              }}
            >
              <span className="pf-daterange__value">
                {displayStart ? (
                  <>
                    <span>{displayStart}</span>
                    <span className="pf-daterange__separator" aria-hidden>
                      –
                    </span>
                    <span className={cx(!displayEnd && 'pf-daterange__value--placeholder')}>
                      {displayEnd || endPlaceholder}
                    </span>
                  </>
                ) : (
                  <span className="pf-daterange__value--placeholder">
                    {startPlaceholder}
                    <span className="pf-daterange__separator" aria-hidden>
                      {' '}
                      –{' '}
                    </span>
                    {endPlaceholder}
                  </span>
                )}
              </span>
              <Icon name="calendar" aria-hidden />
            </button>

            {hasValue ? (
              <button
                type="button"
                className="pf-date-picker__icon-button"
                aria-label="Clear date range"
                disabled={disabled}
                onClick={clearRange}
              >
                <Icon name="circle-xmark" aria-hidden />
              </button>
            ) : null}
          </div>

          {isOpen && typeof document !== 'undefined'
            ? createPortal(
                // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog keyboard handling (Escape, focus trap) lives on the container
                <div
                  ref={popoverRef}
                  id={`${pickerId}-dialog`}
                  className="pf-daterange__popover"
                  role="dialog"
                  aria-label="Date range picker"
                  style={popoverStyle}
                  onKeyDown={(e) => {
                    if (e.key === Keys.Escape) {
                      setSelecting(null);
                      setHoverDate(null);
                      disclosure.close();
                    }
                  }}
                >
                  {selecting === 'start' ? (
                    <p className="pf-daterange__hint" aria-live="polite">
                      Select an end date
                    </p>
                  ) : (
                    <p className="pf-daterange__hint" aria-live="polite">
                      Select a start date
                    </p>
                  )}

                  <div className="pf-daterange__months">
                    {/* Left month — owns nav buttons on mobile, left nav on desktop */}
                    <RangeCalendar
                      monthDate={leftMonth}
                      rangeStart={range.start}
                      rangeEnd={range.end}
                      hoverDate={selecting === 'start' ? hoverDate : null}
                      onDayClick={handleDayClick}
                      onDayHover={(d) => selecting === 'start' && setHoverDate(d)}
                      disabledDates={disabledDates}
                      showOutsideDays={showOutsideDays}
                      isPrevDisabled={isPrevDisabled}
                      isNextDisabled={false}
                      onPrev={() => setLeftMonth((m) => clampMonth(addMonths(m, -1)))}
                      onNext={() => setLeftMonth((m) => clampMonth(addMonths(m, 1)))}
                    />

                    {/* Right month — hides its nav on desktop (left controls both);
                        shows its own nav only on mobile via CSS */}
                    <RangeCalendar
                      monthDate={rightMonth}
                      rangeStart={range.start}
                      rangeEnd={range.end}
                      hoverDate={selecting === 'start' ? hoverDate : null}
                      onDayClick={handleDayClick}
                      onDayHover={(d) => selecting === 'start' && setHoverDate(d)}
                      disabledDates={disabledDates}
                      showOutsideDays={showOutsideDays}
                      isPrevDisabled={false}
                      isNextDisabled={isNextDisabled}
                      onPrev={() => setLeftMonth((m) => clampMonth(addMonths(m, -1)))}
                      onNext={() => setLeftMonth((m) => clampMonth(addMonths(m, 1)))}
                      hideNavDesktop
                    />
                  </div>
                </div>,
                document.body,
              )
            : null}
        </div>
      </FieldWrapper>
    );
  },
);

DateRangePicker.displayName = 'DateRangePicker';
