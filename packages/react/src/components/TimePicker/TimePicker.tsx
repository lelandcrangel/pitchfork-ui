import {
  formatTimeDisplay,
  formatTimeValue,
  hourOptions,
  meridiemOf,
  padTimePart,
  parseTimeValue,
  timeRange,
  toHour12,
  toHour24,
  type HourCycle,
  type Meridiem,
  type TimeParts,
} from '@pitchfork-ui/core';
import { forwardRef, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { composeDescribedBy, Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useComposedRefs,
  useControllableState,
  useDisclosure,
  useFocusTrap,
  useOutsideInteraction,
  usePresence,
} from '../../hooks';
import { cx } from '../../utils/cx';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { Icon } from '../Icon';
import './TimePicker.css';

/** Re-exported so `TimePickerProps` keeps naming a type from this module. */
export type { HourCycle };

export interface TimePickerProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  /** Canonical 24-hour value `"HH:mm"` (e.g. `"14:30"`), or `""` when unset. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 12- or 24-hour display. Defaults to 24. The value is always canonical 24h. */
  hourCycle?: HourCycle;
  /** Granularity of the minutes column. Defaults to 1. */
  minuteStep?: number;
  label?: string;
  description?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  name?: string;
}

// ─── component ───────────────────────────────────────────────────────────────

export const TimePicker = forwardRef<HTMLButtonElement, TimePickerProps>(function TimePicker(
  {
    id,
    value,
    defaultValue,
    onValueChange,
    hourCycle = 24,
    minuteStep = 1,
    label,
    description,
    error,
    placeholder = 'Select time',
    required,
    name,
    disabled,
    className,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const panelId = `${fieldId}-panel`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = composeDescribedBy(ariaDescribedBy, descriptionId, errorId);

  const [current, setCurrent] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? '',
    onChange: onValueChange,
  });
  const parts = parseTimeValue(current ?? '');

  const disclosure = useDisclosure({ disabled });
  const isOpen = disclosure.isOpen ?? false;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const triggerRefs = useComposedRefs(triggerRef, ref);
  const panelRef = useRef<HTMLDivElement>(null);
  const { isMounted, isExiting } = usePresence(isOpen, 160);

  const panelStyle = useAnchoredPosition({
    anchorRef: rootRef,
    floatingRef: panelRef,
    enabled: isOpen,
    matchAnchorWidth: false,
    flip: true,
  });

  useOutsideInteraction({
    refs: [rootRef, panelRef],
    enabled: isOpen,
    onInteractOutside: () => disclosure.close(),
  });

  useFocusTrap({
    containerRef: panelRef,
    enabled: isOpen,
    onEscape: disclosure.close,
  });

  // Column option sets.
  const hours = hourOptions(hourCycle);
  const minutes = timeRange(60, minuteStep);
  const meridiems: Meridiem[] = ['AM', 'PM'];

  const selectedMeridiem: Meridiem | null = parts.hour === null ? null : meridiemOf(parts.hour);
  const selectedHourDisplay =
    parts.hour === null ? null : hourCycle === 24 ? parts.hour : toHour12(parts.hour);

  const emit = (next: TimeParts) => {
    const value = formatTimeValue(next);
    if (!value) return;
    setCurrent(value);
  };

  const selectHour = (h: number) => {
    const hour24 = hourCycle === 24 ? h : toHour24(h, selectedMeridiem ?? 'AM');
    emit({ hour: hour24, minute: parts.minute ?? 0 });
  };

  const selectMinute = (m: number) => {
    emit({ hour: parts.hour ?? 0, minute: m });
  };

  const selectMeridiem = (mer: Meridiem) => {
    emit({ hour: toHour24(toHour12(parts.hour ?? 0), mer), minute: parts.minute ?? 0 });
  };

  const display = formatTimeDisplay(parts, hourCycle);

  // Scroll the selected option of each column into view when the panel opens.
  useEffect(() => {
    if (!isMounted) return;
    const frame = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelectorAll<HTMLElement>('[data-selected="true"]')
        .forEach((el) => el.scrollIntoView({ block: 'center' }));
    });
    return () => cancelAnimationFrame(frame);
  }, [isMounted]);

  const onColumnKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== Keys.ArrowDown && event.key !== Keys.ArrowUp) return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index === -1) return;
    event.preventDefault();
    const nextIndex =
      event.key === Keys.ArrowDown
        ? Math.min(index + 1, buttons.length - 1)
        : Math.max(index - 1, 0);
    buttons[nextIndex]?.focus();
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
      <div className="pf-timepicker" ref={rootRef}>
        {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- aria-invalid/aria-required on a dialog-opener trigger is a known form-field pattern; combobox role is not appropriate here because aria-controls would reference a conditionally-rendered portal that axe can't reliably resolve */}
        <button
          {...props}
          id={fieldId}
          ref={triggerRefs}
          type="button"
          className={cx(
            'pf-timepicker__trigger',
            isOpen && 'pf-timepicker__trigger--open',
            error && 'pf-timepicker__trigger--invalid',
            className,
          )}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onClick={() => disclosure.toggle()}
          onKeyDown={(event) => {
            if (event.key === Keys.Escape) disclosure.close();
          }}
        >
          <span
            className={cx('pf-timepicker__value', !display && 'pf-timepicker__value--placeholder')}
          >
            {display || placeholder}
          </span>
          <span aria-hidden className="pf-timepicker__icon">
            <Icon name="clock" aria-hidden />
          </span>
        </button>

        {name ? <input type="hidden" name={name} value={current ?? ''} /> : null}

        {isMounted && typeof document !== 'undefined'
          ? createPortal(
              <div
                id={panelId}
                ref={panelRef}
                role="dialog"
                aria-label={label ? `${label} picker` : 'Time picker'}
                className={cx('pf-timepicker__panel', isExiting && 'pf-timepicker__panel--exiting')}
                style={panelStyle}
              >
                {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- options are focusable buttons (roving focus); the listbox container needs no tabindex */}
                <div
                  className="pf-timepicker__column"
                  role="listbox"
                  aria-label="Hour"
                  onKeyDown={onColumnKeyDown}
                >
                  {hours.map((h) => {
                    const isSel = selectedHourDisplay === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        data-selected={isSel}
                        className={cx(
                          'pf-timepicker__option',
                          isSel && 'pf-timepicker__option--selected',
                        )}
                        onClick={() => selectHour(h)}
                      >
                        {padTimePart(h)}
                      </button>
                    );
                  })}
                </div>

                {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- options are focusable buttons (roving focus); the listbox container needs no tabindex */}
                <div
                  className="pf-timepicker__column"
                  role="listbox"
                  aria-label="Minute"
                  onKeyDown={onColumnKeyDown}
                >
                  {minutes.map((m) => {
                    const isSel = parts.minute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="option"
                        aria-selected={isSel}
                        data-selected={isSel}
                        className={cx(
                          'pf-timepicker__option',
                          isSel && 'pf-timepicker__option--selected',
                        )}
                        onClick={() => selectMinute(m)}
                      >
                        {padTimePart(m)}
                      </button>
                    );
                  })}
                </div>

                {hourCycle === 12 ? (
                  // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- options are focusable buttons (roving focus); the listbox container needs no tabindex
                  <div
                    className="pf-timepicker__column pf-timepicker__column--meridiem"
                    role="listbox"
                    aria-label="AM or PM"
                    onKeyDown={onColumnKeyDown}
                  >
                    {meridiems.map((mer) => {
                      const isSel = selectedMeridiem === mer;
                      return (
                        <button
                          key={mer}
                          type="button"
                          role="option"
                          aria-selected={isSel}
                          data-selected={isSel}
                          className={cx(
                            'pf-timepicker__option',
                            isSel && 'pf-timepicker__option--selected',
                          )}
                          onClick={() => selectMeridiem(mer)}
                        >
                          {mer}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>,
              document.body,
            )
          : null}
      </div>
    </FieldWrapper>
  );
});

TimePicker.displayName = 'TimePicker';
