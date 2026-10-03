import {
  addMonths,
  buildCalendarDays,
  CALENDAR_CELL_COUNT,
  clampMonthToYearRange,
  formatISODate,
  isOutsideDateRange,
  isSameDay,
  Keys,
  moveCalendarDate,
  parseISODate,
  startOfMonth,
  toMidday,
  WEEKDAY_LABELS,
  type CalendarMove,
} from '@pitchfork-ui/core';

import {
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

/** Which key moves the focused day where. */
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
 * A month grid for picking a date.
 *
 * **It has a keyboard, which the React component does not.** `Calendar`
 * renders 42 buttons and no key handling, so reaching the end of a month means
 * 42 presses of Tab and there is no way to move by week at all. This grid is
 * the ARIA pattern instead: one tab stop, arrows to move a day, up and down a
 * week, Home and End to the ends of the week, PageUp/PageDown a month. The
 * arithmetic is core's `moveCalendarDate`, so the React component can adopt it
 * without the two disagreeing — recorded in `todo.md`.
 *
 * Month and year are native `<select>`s rather than two `pf-dropdown`s. A year
 * range of a century would mean a hundred custom elements rendered into this
 * shadow root for one control, and a `<select>` brings its own keyboard and
 * its platform picker on a phone.
 *
 * @part calendar - the root box.
 * @part header - the month and year controls row.
 * @part grid - the month grid.
 * @part day - every day cell.
 * @part selected - the selected day.
 * @part today - today's cell.
 */
@Component({
  tag: 'pf-calendar',
  styleUrl: 'pf-calendar.css',
  shadow: true,
})
export class PfCalendar {
  @Element() el!: HTMLElement;

  /** The selected date, as `YYYY-MM-DD`. Reflected, so a selector can find it. */
  @Prop({ mutable: true, reflect: true }) value?: string;

  /** Earliest selectable date, as `YYYY-MM-DD`. */
  @Prop() min?: string;

  /** Latest selectable date, as `YYYY-MM-DD`. */
  @Prop() max?: string;

  /** First year offered in the year picker. Defaults to 50 years back. */
  @Prop() startYear?: number;

  /** Last year offered in the year picker. Defaults to 50 years on. */
  @Prop() endYear?: number;

  /** Render the days borrowed from the neighbouring months. */
  @Prop() showOutsideDays = true;

  /** Accessible name for the grid. */
  @Prop() label = 'Calendar';

  /**
   * A predicate for days that cannot be chosen, beyond `min` and `max`.
   *
   * A property rather than an attribute, because a function cannot be written
   * in HTML — the generated bindings set props as properties, so a React or
   * Angular consumer passes it as they would any other prop, and a plain-HTML
   * consumer uses `min`/`max` or assigns it in script.
   */
  @Prop() isDateDisabled?: (date: Date) => boolean;

  /** Fires with the chosen date, as `YYYY-MM-DD`. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /** The month on screen. */
  @State() displayMonth: Date = startOfMonth(new Date());

  /** The day the grid's single tab stop sits on. */
  @State() focusedDate: Date = toMidday(new Date());

  /** Set once a key or a click has moved focus, so the first paint does not steal it. */
  private shouldRestoreFocus = false;

  componentWillLoad() {
    const selected = this.selectedDate();
    const base = selected ?? toMidday(new Date());
    this.focusedDate = base;
    this.displayMonth = this.clamp(startOfMonth(base));
  }

  componentDidRender() {
    if (!this.shouldRestoreFocus) return;
    this.shouldRestoreFocus = false;
    // The grid has one tab stop, so after a move the new one has to be given
    // focus explicitly — the old button may not even exist any more.
    this.el.shadowRoot?.querySelector<HTMLButtonElement>('button[data-day][tabindex="0"]')?.focus();
  }

  /** Follows a value set from outside, so the grid shows what it is told. */
  @Watch('value')
  syncValue() {
    const selected = this.selectedDate();
    if (!selected) return;
    this.focusedDate = selected;
    this.displayMonth = this.clamp(startOfMonth(selected));
  }

  /** Moves the grid to the month holding `date` (a `Date` or `YYYY-MM-DD`). */
  @Method()
  async goToMonth(date: string | Date): Promise<void> {
    const target = typeof date === 'string' ? parseISODate(date) : toMidday(date);
    if (!target) return;
    this.displayMonth = this.clamp(startOfMonth(target));
    this.focusedDate = target;
  }

  private selectedDate(): Date | null {
    return parseISODate(this.value);
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

  private isDisabled(date: Date): boolean {
    const min = parseISODate(this.min);
    const max = parseISODate(this.max);
    if (isOutsideDateRange(date, min, max)) return true;
    return this.isDateDisabled?.(date) ?? false;
  }

  private select(date: Date) {
    if (this.isDisabled(date)) return;
    this.value = formatISODate(date);
    this.focusedDate = date;
    this.displayMonth = this.clamp(startOfMonth(date));
    this.pfChange.emit({ value: this.value });
  }

  /**
   * Moves the focused day, bringing the grid with it.
   *
   * A disabled day can still be focused — skipping it would make a long
   * blocked stretch impossible to cross, and the ARIA pattern is that focus
   * moves freely while activation is refused.
   */
  private moveFocus(move: CalendarMove) {
    const next = moveCalendarDate(this.focusedDate, move);
    const { start, end } = this.years;
    if (next.getFullYear() < start || next.getFullYear() > end) return;

    this.focusedDate = next;
    this.displayMonth = this.clamp(startOfMonth(next));
    this.shouldRestoreFocus = true;
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
      this.select(this.focusedDate);
      this.shouldRestoreFocus = true;
    }
  };

  /**
   * Shows a month and brings the tab stop with it.
   *
   * Both halves, always. Moving `displayMonth` alone leaves `focusedDate` on a
   * day that is no longer rendered, so no cell carries `tabindex="0"` and the
   * grid drops out of the tab order altogether — reachable by mouse and by
   * nothing else. The year picker did exactly that until a test went looking.
   */
  private showMonth(month: Date) {
    const target = this.clamp(startOfMonth(month));
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12).getDate();
    this.displayMonth = target;
    this.focusedDate = new Date(
      target.getFullYear(),
      target.getMonth(),
      Math.min(this.focusedDate.getDate(), lastDay),
      12,
    );
  }

  private stepMonth(amount: number) {
    this.showMonth(addMonths(this.displayMonth, amount));
  }

  private renderHeader() {
    const { start, end } = this.years;
    const years = Array.from({ length: end - start + 1 }, (_, index) => start + index);
    const months = Array.from({ length: 12 }, (_, month) =>
      new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2024, month, 1)),
    );

    const atFirst = this.displayMonth.getFullYear() === start && this.displayMonth.getMonth() === 0;
    const atLast = this.displayMonth.getFullYear() === end && this.displayMonth.getMonth() === 11;

    return (
      <div class="header" part="header">
        <button
          type="button"
          class="nav"
          aria-label="Previous month"
          disabled={atFirst}
          onClick={() => this.stepMonth(-1)}
        >
          <pf-icon name="square-caret-left"></pf-icon>
        </button>

        <div class="controls">
          <select
            class="select"
            aria-label="Month"
            onChange={(event) => {
              const month = Number((event.target as HTMLSelectElement).value);
              this.showMonth(new Date(this.displayMonth.getFullYear(), month, 1, 12));
            }}
          >
            {months.map((name, month) => (
              <option
                key={name}
                value={String(month)}
                selected={month === this.displayMonth.getMonth()}
              >
                {name}
              </option>
            ))}
          </select>

          <select
            class="select"
            aria-label="Year"
            onChange={(event) => {
              const year = Number((event.target as HTMLSelectElement).value);
              this.showMonth(new Date(year, this.displayMonth.getMonth(), 1, 12));
            }}
          >
            {years.map((year) => (
              <option
                key={year}
                value={String(year)}
                selected={year === this.displayMonth.getFullYear()}
              >
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          class="nav"
          aria-label="Next month"
          disabled={atLast}
          onClick={() => this.stepMonth(1)}
        >
          <pf-icon name="square-caret-right"></pf-icon>
        </button>
      </div>
    );
  }

  render() {
    const days = buildCalendarDays(this.displayMonth);
    const selected = this.selectedDate();
    const today = toMidday(new Date());
    const monthLabel = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(this.displayMonth);

    return (
      <Host>
        <div class="calendar" part="calendar">
          {this.renderHeader()}

          <div
            class="grid"
            part="grid"
            role="grid"
            aria-label={`${this.label}, ${monthLabel}`}
            onKeyDown={this.onKeyDown}
          >
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
                  if (!this.showOutsideDays && !inCurrentMonth) {
                    return <span key={formatISODate(date)} class="empty" role="gridcell"></span>;
                  }

                  const isSelected = selected ? isSameDay(selected, date) : false;
                  const isToday = isSameDay(today, date);
                  const isFocused = isSameDay(this.focusedDate, date);
                  const disabled = this.isDisabled(date);

                  return (
                    <button
                      key={formatISODate(date)}
                      type="button"
                      role="gridcell"
                      data-day={formatISODate(date)}
                      part={`day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                      class={{
                        day: true,
                        'day--outside': !inCurrentMonth,
                        'day--today': isToday,
                        'day--selected': isSelected,
                      }}
                      /* One tab stop for the whole grid: the arrows do the rest. */
                      tabindex={isFocused ? 0 : -1}
                      aria-selected={isSelected ? 'true' : 'false'}
                      aria-current={isToday ? 'date' : null}
                      aria-disabled={disabled ? 'true' : null}
                      aria-label={new Intl.DateTimeFormat('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(date)}
                      onClick={() => {
                        this.select(date);
                        this.shouldRestoreFocus = true;
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
      </Host>
    );
  }
}
