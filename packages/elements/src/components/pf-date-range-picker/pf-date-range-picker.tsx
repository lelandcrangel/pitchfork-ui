import {
  addMonths,
  buildCalendarDays,
  CALENDAR_CELL_COUNT,
  clampMonthToYearRange,
  composeDescribedBy,
  formatDateRange,
  formatISODate,
  isOutsideDateRange,
  isSameDay,
  isSameMonth,
  Keys,
  moveCalendarDate,
  nextDateRangeSelection,
  observeAnchoredPosition,
  parseDateRange,
  parseISODate,
  rangeDayState,
  startOfMonth,
  toMidday,
  WEEKDAY_LABELS,
  type CalendarMove,
  type DateRangeValue,
} from '@pitchfork-ui/core';

import { applyControlValidity } from '../../form-validity';
import { placePopover } from '../../place-popover';
import {
  AttachInternals,
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';

const MOVES: Record<string, CalendarMove> = {
  [Keys.ArrowRight]: 'day-next',
  [Keys.ArrowLeft]: 'day-previous',
  [Keys.ArrowDown]: 'week-next',
  [Keys.ArrowUp]: 'week-previous',
  [Keys.Home]: 'week-start',
  [Keys.End]: 'week-end',
  PageDown: 'month-next',
  PageUp: 'month-previous',
};

/**
 * A form-associated date-range field: two month grids in a popover, with a
 * preview that follows the pointer while the range is half-made.
 *
 * **It submits two entries from one control.** `setFormValue` accepts a
 * `FormData`, and every entry in it is submitted — measured, along with the
 * fact that the element's own `name` attribute is then ignored entirely. So a
 * range goes in as `${name}-start` and `${name}-end`, which is what a server
 * handling a form actually wants, rather than one field a handler has to split.
 * The `value` property stays a single round-trippable `start/end` string.
 *
 * The grids are rendered here rather than composed from two `pf-calendar`s:
 * the range preview spans both months, so one element has to own the hover and
 * the selection for both. The day-state and selection rules are core's, shared
 * with the React component.
 *
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part trigger - the button that opens the grids.
 * @part clear - the clear button.
 * @part panel - the floating panel.
 * @part grid - each month grid.
 * @part day - every day cell.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-date-range-picker',
  styleUrl: 'pf-date-range-picker.css',
  formAssociated: true,
  shadow: true,
})
export class PfDateRangePicker {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /**
   * The base name for the two submitted entries, `${name}-start` and
   * `${name}-end`. Reflected for selectors; the submission reads the property,
   * because a `FormData` value carries its own keys.
   */
  @Prop({ reflect: true }) name?: string;

  /** The range as `YYYY-MM-DD/YYYY-MM-DD`, or empty. */
  @Prop({ mutable: true }) value = '';

  /** Whether the panel is showing. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) open = false;

  @Prop() label?: string;

  @Prop() description?: string;

  @Prop() error?: string;

  @Prop() placeholder = 'Select dates';

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Offer a button that empties the range. */
  @Prop() allowClear = false;

  @Prop() min?: string;

  @Prop() max?: string;

  @Prop() startYear?: number;

  @Prop() endYear?: number;

  /** A predicate for days that cannot be chosen; see `pf-calendar`. */
  @Prop() isDateDisabled?: (date: Date) => boolean;

  /** Fires when the range changes or is cleared, with the `start/end` string. */
  @Event() pfChange!: EventEmitter<{ value: string; start: string; end: string }>;

  /** Fires whenever the panel opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** The left-hand month; the right-hand one is always the month after. */
  @State() leftMonth: Date = startOfMonth(new Date());

  /** The day the grids' single tab stop sits on. */
  @State() focusedDate: Date = toMidday(new Date());

  /** The day under the pointer, which previews the missing end. */
  @State() hovered: Date | null = null;

  /** True once a start is chosen and the next click sets the end. */
  @State() awaitingEnd = false;

  private initialValue = '';

  /**
   * The start held while the range is half-made.
   *
   * Not in `value`, because `value` is the *submitted* range and a half-made
   * one is not a range — a form read mid-selection would see a start with no
   * end. Held here instead, and folded back in for rendering.
   */
  private pendingStart: Date | null = null;
  private stopObserving?: () => void;
  private shouldRestoreFocus = false;

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    const { start } = this.range();
    const base = start ?? toMidday(new Date());
    this.focusedDate = base;
    this.leftMonth = this.clamp(startOfMonth(base));
    this.syncFormState();
  }

  componentDidRender() {
    if (!this.shouldRestoreFocus) return;
    this.shouldRestoreFocus = false;
    this.el.shadowRoot?.querySelector<HTMLButtonElement>('button[data-day][tabindex="0"]')?.focus();
  }

  disconnectedCallback() {
    this.stopObserving?.();
  }

  /**
   * Follows a range set from outside, so the grids show what they are told.
   *
   * Without this the element kept whatever month it loaded with, and a
   * consumer assigning `value` got a correct value over the wrong months —
   * the days it names were not even rendered.
   */
  @Watch('value')
  syncDisplayedMonths() {
    const { start, end } = this.range();
    if (!start || !end) return;
    this.pendingStart = null;
    this.awaitingEnd = false;
    this.focusedDate = start;
    this.leftMonth = this.clamp(startOfMonth(start));
  }

  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    const { start, end } = this.range();

    if (!start || !end || !this.name) {
      this.internals.setFormValue(null);
    } else {
      /*
       * A FormData, so one control submits both ends. Measured: every entry in
       * it reaches the submission, and the element's own `name` attribute is
       * ignored in this mode — which is why the keys are built here.
       */
      const data = new FormData();
      data.append(`${this.name}-start`, formatISODate(start));
      data.append(`${this.name}-end`, formatISODate(end));
      this.internals.setFormValue(data);
    }

    applyControlValidity(this.internals, Boolean(start && end), this.required, this.error);
  }

  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showPanel();
    else this.hidePanel();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  @Method()
  async show(): Promise<void> {
    if (!this.disabled) this.open = true;
  }

  @Method()
  async hide(): Promise<void> {
    this.open = false;
  }

  @Method()
  async checkValidity(): Promise<boolean> {
    return this.internals.checkValidity();
  }

  @Method()
  async reportValidity(): Promise<boolean> {
    return this.internals.reportValidity();
  }

  @Method()
  async getValidationMessage(): Promise<string> {
    return this.internals.validationMessage;
  }

  formResetCallback() {
    this.value = this.initialValue;
    this.awaitingEnd = false;
    this.hovered = null;
  }

  private range(): DateRangeValue {
    return parseDateRange(this.value, parseISODate);
  }

  private get years() {
    const now = new Date().getFullYear();
    const start = this.startYear ?? now - 50;
    const end = this.endYear ?? now + 50;
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }

  private clamp(date: Date): Date {
    const { start, end } = this.years;
    return clampMonthToYearRange(date, start, end);
  }

  private get panel() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null;
  }

  private get trigger() {
    return this.el.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]') ?? null;
  }

  private isDisabled(date: Date): boolean {
    if (isOutsideDateRange(date, parseISODate(this.min), parseISODate(this.max))) return true;
    return this.isDateDisabled?.(date) ?? false;
  }

  private showPanel() {
    const panel = this.panel;
    if (this.disabled || !panel || panel.matches(':popover-open')) return;

    panel.showPopover();
    this.stopObserving?.();
    this.stopObserving = observeAnchoredPosition({
      getAnchor: () => this.trigger,
      getFloating: () => panel,
      align: 'start',
      matchAnchorWidth: false,
      flip: true,
      onChange: ({ left, top }) => placePopover(panel, left, top),
    });

    this.shouldRestoreFocus = true;
  }

  private hidePanel() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    this.hovered = null;
    const panel = this.panel;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  private onToggle = (event: ToggleEvent) => {
    const nowOpen = event.newState === 'open';
    if (this.open !== nowOpen) this.open = nowOpen;
    if (!nowOpen) this.trigger?.focus();
  };

  /** One click through core's state machine, plus this element's side-effects. */
  private pick(date: Date) {
    if (this.isDisabled(date)) return;

    /*
     * `displayRange()`, not `range()`. A half-made range is deliberately kept
     * out of `value`, so reading the state machine's input from `value` hands
     * it a range with no start — and core, correctly, treats that as "begin a
     * new range". Every second click restarted instead of closing. Caught by
     * the swap and Enter tests.
     */
    const next = nextDateRangeSelection(
      { range: this.displayRange(), awaitingEnd: this.awaitingEnd },
      date,
    );

    this.awaitingEnd = next.awaitingEnd;
    this.focusedDate = toMidday(date);

    if (next.awaitingEnd) {
      // Half-made: hold the start without reporting an incomplete range.
      this.value = '';
      this.pendingStart = next.range.start;
      return;
    }

    this.pendingStart = null;
    this.hovered = null;
    this.value = formatDateRange(next.range, formatISODate);
    this.pfChange.emit({
      value: this.value,
      start: next.range.start ? formatISODate(next.range.start) : '',
      end: next.range.end ? formatISODate(next.range.end) : '',
    });
    this.open = false;
  }

  /** What the grids draw: the committed range, or the half-made one. */
  private displayRange(): DateRangeValue {
    const committed = this.range();
    if (committed.start && committed.end) return committed;
    return { start: this.pendingStart, end: null };
  }

  private moveFocus(move: CalendarMove) {
    const next = moveCalendarDate(this.focusedDate, move);
    const { start, end } = this.years;
    if (next.getFullYear() < start || next.getFullYear() > end) return;

    this.focusedDate = next;
    this.shouldRestoreFocus = true;

    // Keep the focused day on screen: it belongs to one of the two months.
    const right = addMonths(this.leftMonth, 1);
    if (!isSameMonth(next, this.leftMonth) && !isSameMonth(next, right)) {
      this.leftMonth = this.clamp(startOfMonth(next));
    }
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      this.moveFocus(move);
      return;
    }

    if (event.key === Keys.Enter || event.key === Keys.Space) {
      event.preventDefault();
      this.pick(this.focusedDate);
      this.shouldRestoreFocus = true;
    }
  };

  private clear = (event: MouseEvent) => {
    event.stopPropagation();
    if (!this.value && !this.pendingStart) return;
    this.value = '';
    this.pendingStart = null;
    this.awaitingEnd = false;
    this.hovered = null;
    this.pfChange.emit({ value: '', start: '', end: '' });
  };

  private formatted(): string {
    const { start, end } = this.range();
    if (!start || !end) return '';
    const format = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${format.format(start)} – ${format.format(end)}`;
  }

  private renderGrid(month: Date) {
    const days = buildCalendarDays(month);
    const range = this.displayRange();
    const today = toMidday(new Date());
    const label = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(month);

    return (
      <div class="month">
        <p class="month-label">{label}</p>
        <div class="grid" part="grid" role="grid" aria-label={label}>
          <div class="row" role="row">
            {WEEKDAY_LABELS.map((day) => (
              <span key={day} class="weekday" role="columnheader" aria-label={day}>
                {day}
              </span>
            ))}
          </div>

          {Array.from({ length: CALENDAR_CELL_COUNT / 7 }, (_, week) => (
            <div key={week} class="row" role="row">
              {days.slice(week * 7, week * 7 + 7).map(({ date, inCurrentMonth }) => {
                if (!inCurrentMonth) {
                  return <span key={formatISODate(date)} class="empty" role="gridcell"></span>;
                }

                const state = rangeDayState(date, range, this.hovered);
                const isEndpoint = state.isStart || state.isEnd;
                const disabled = this.isDisabled(date);

                return (
                  <button
                    key={formatISODate(date)}
                    type="button"
                    role="gridcell"
                    data-day={formatISODate(date)}
                    part="day"
                    class={{
                      day: true,
                      'day--today': isSameDay(today, date),
                      'day--endpoint': isEndpoint,
                      'day--start': state.isStart,
                      'day--end': state.isEnd,
                      'day--inside': state.isInside,
                    }}
                    tabindex={isSameDay(this.focusedDate, date) ? 0 : -1}
                    aria-selected={isEndpoint || state.isInside ? 'true' : 'false'}
                    aria-current={isSameDay(today, date) ? 'date' : null}
                    aria-disabled={disabled ? 'true' : null}
                    aria-label={new Intl.DateTimeFormat('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(date)}
                    onClick={() => {
                      this.pick(date);
                      this.shouldRestoreFocus = true;
                    }}
                    onMouseEnter={() => {
                      if (this.awaitingEnd && !disabled) this.hovered = date;
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
    );
  }

  render() {
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );
    const text = this.formatted();
    const right = addMonths(this.leftMonth, 1);

    return (
      <Host>
        <div class="field" part="field">
          {this.label && (
            <label class="label" part="label" htmlFor="trigger">
              {this.label}
              {this.required && (
                <span class="required" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          <div class="row-controls">
            <button
              id="trigger"
              part="trigger"
              class={{ trigger: true, 'trigger--invalid': Boolean(this.error) }}
              type="button"
              disabled={this.disabled}
              aria-haspopup="dialog"
              aria-expanded={this.open ? 'true' : 'false'}
              aria-controls="panel"
              aria-invalid={this.error ? 'true' : null}
              aria-required={this.required ? 'true' : null}
              aria-describedby={describedBy}
              onClick={() => {
                if (!this.disabled) this.open = !this.open;
              }}
            >
              <span class={{ value: true, 'value--placeholder': !text }}>
                {text || this.placeholder}
              </span>
              <pf-icon name="calendar"></pf-icon>
            </button>

            {this.allowClear && (this.value || this.pendingStart) && (
              <button
                class="clear"
                part="clear"
                type="button"
                aria-label="Clear selected dates"
                disabled={this.disabled}
                onClick={this.clear}
              >
                <pf-icon name="circle-xmark"></pf-icon>
              </button>
            )}
          </div>

          {this.description && (
            <p class="description" part="description" id="description">
              {this.description}
            </p>
          )}
          {this.error && (
            <p class="error" part="error" id="error">
              {this.error}
            </p>
          )}
        </div>

        <div
          id="panel"
          part="panel"
          class="panel"
          popover="auto"
          role="dialog"
          aria-label="Choose a date range"
          onToggle={this.onToggle}
          onKeyDown={this.onKeyDown}
          onMouseLeave={() => {
            this.hovered = null;
          }}
        >
          <div class="nav">
            <button
              type="button"
              class="step"
              aria-label="Previous month"
              onClick={() => {
                this.leftMonth = this.clamp(addMonths(this.leftMonth, -1));
              }}
            >
              <pf-icon name="square-caret-left"></pf-icon>
            </button>
            <button
              type="button"
              class="step"
              aria-label="Next month"
              onClick={() => {
                this.leftMonth = this.clamp(addMonths(this.leftMonth, 1));
              }}
            >
              <pf-icon name="square-caret-right"></pf-icon>
            </button>
          </div>

          <div class="months">
            {this.renderGrid(this.leftMonth)}
            {this.renderGrid(right)}
          </div>
        </div>
      </Host>
    );
  }
}
