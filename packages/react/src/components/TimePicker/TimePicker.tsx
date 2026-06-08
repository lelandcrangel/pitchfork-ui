import { forwardRef, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { composeDescribedBy, Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useComposedRefs,
  useControllableState,
  useDisclosure,
  useOutsideInteraction,
  usePresence,
} from '../../hooks';
import { cx } from '../../utils/cx';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { Icon } from '../Icon';
import './TimePicker.css';

export type HourCycle = 12 | 24;

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

// ─── helpers ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

interface Parts {
  hour: number | null; // 0–23
  minute: number | null; // 0–59
}

const parseValue = (value: string): Parts => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return { hour: null, minute: null };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { hour: null, minute: null };
  return { hour, minute };
};

const formatDisplay = (parts: Parts, hourCycle: HourCycle): string => {
  if (parts.hour === null || parts.minute === null) return '';
  if (hourCycle === 24) return `${pad(parts.hour)}:${pad(parts.minute)}`;
  const meridiem = parts.hour < 12 ? 'AM' : 'PM';
  const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  return `${h12}:${pad(parts.minute)} ${meridiem}`;
};

const range = (length: number, step = 1) =>
  Array.from({ length: Math.ceil(length / step) }, (_, i) => i * step);

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
  const parts = parseValue(current ?? '');

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

  // Column option sets.
  const hours = hourCycle === 24 ? range(24) : range(12).map((h) => h + 1); // 24h: 0–23, 12h: 1–12
  const minutes = range(60, minuteStep);
  const meridiems: Array<'AM' | 'PM'> = ['AM', 'PM'];

  const selectedMeridiem: 'AM' | 'PM' | null =
    parts.hour === null ? null : parts.hour < 12 ? 'AM' : 'PM';
  const selectedHourDisplay =
    parts.hour === null
      ? null
      : hourCycle === 24
        ? parts.hour
        : parts.hour % 12 === 0
          ? 12
          : parts.hour % 12;

  const emit = (next: Parts) => {
    if (next.hour === null || next.minute === null) return;
    setCurrent(`${pad(next.hour)}:${pad(next.minute)}`);
  };

  const selectHour = (h: number) => {
    let hour24: number;
    if (hourCycle === 24) {
      hour24 = h;
    } else {
      const meridiem = selectedMeridiem ?? 'AM';
      const base = h % 12; // 12 → 0
      hour24 = meridiem === 'PM' ? base + 12 : base;
    }
    emit({ hour: hour24, minute: parts.minute ?? 0 });
  };

  const selectMinute = (m: number) => {
    emit({ hour: parts.hour ?? (hourCycle === 12 ? 0 : 0), minute: m });
  };

  const selectMeridiem = (mer: 'AM' | 'PM') => {
    const baseHour = parts.hour ?? 0;
    const base = baseHour % 12;
    const hour24 = mer === 'PM' ? base + 12 : base;
    emit({ hour: hour24, minute: parts.minute ?? 0 });
  };

  const display = formatDisplay(parts, hourCycle);

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
                        {pad(h)}
                      </button>
                    );
                  })}
                </div>

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
                        {pad(m)}
                      </button>
                    );
                  })}
                </div>

                {hourCycle === 12 ? (
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
