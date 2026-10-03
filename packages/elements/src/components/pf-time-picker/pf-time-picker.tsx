import {
  composeDescribedBy,
  formatTimeDisplay,
  formatTimeValue,
  hourOptions,
  Keys,
  meridiemOf,
  observeAnchoredPosition,
  padTimePart,
  parseTimeValue,
  timeRange,
  toHour12,
  toHour24,
  type HourCycle,
  type Meridiem,
  type TimeParts,
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
  Watch,
} from '@stencil/core';

/**
 * A form-associated time field: a trigger that opens hour, minute and (on a
 * 12-hour cycle) meridiem columns in a popover.
 *
 * The submitted value is always canonical 24-hour `HH:mm`, whatever
 * `hour-cycle` displays. A control whose submitted value changed with its
 * display would be unusable on a server, so the cycle is a rendering choice
 * and nothing more — all of that arithmetic is core's.
 *
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part trigger - the button that opens the columns.
 * @part panel - the floating panel.
 * @part column - each of the scrolling columns.
 * @part option - every option button.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-time-picker',
  styleUrl: 'pf-time-picker.css',
  formAssociated: true,
  shadow: true,
})
export class PfTimePicker {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Submitted under this name. Reflected; the submission reads the attribute. */
  @Prop({ reflect: true }) name?: string;

  /** Canonical 24-hour `HH:mm`, or empty. */
  @Prop({ mutable: true }) value = '';

  /** Whether the panel is showing. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /**
   * 12- or 24-hour display. The value stays 24-hour either way.
   *
   * Read through `cycle` below, never directly: Stencil coerces an attribute
   * using the prop's type as *written*, and it cannot resolve a name it had
   * to import. Measured: with `HourCycle` imported from core,
   * `hour-cycle="12"` arrives as the **string** `"12"`, so `=== 12` is
   * false, while `minute-step="15"` — declared `number` — arrives as `15`.
   * Writing `0 | 1` out inline *is* coerced, which `pf-heatmap.weekStartsOn`
   * shows; the alias is kept here because it is the shared type, and the
   * getter costs nothing.
   */
  @Prop() hourCycle: HourCycle = 24;

  /** Granularity of the minutes column. */
  @Prop() minuteStep = 1;

  @Prop() label?: string;

  @Prop() description?: string;

  @Prop() error?: string;

  @Prop() placeholder = 'Select time';

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Fires when the time changes, with the canonical `HH:mm`. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /** Fires whenever the panel opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  private initialValue = '';
  private stopObserving?: () => void;

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    this.syncFormState();
  }

  componentDidRender() {
    if (this.open) this.scrollSelectedIntoView();
  }

  disconnectedCallback() {
    this.stopObserving?.();
  }

  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    this.internals.setFormValue(this.value || null);
    applyControlValidity(this.internals, Boolean(this.value), this.required, this.error);
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

  /** A reset restores the value the field started with, not an empty one. */
  formResetCallback() {
    this.value = this.initialValue;
  }

  /** `hourCycle` with the attribute case coerced; see the prop's comment. */
  private get cycle(): HourCycle {
    return Number(this.hourCycle) === 12 ? 12 : 24;
  }

  private get panel() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null;
  }

  private get trigger() {
    return this.el.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]') ?? null;
  }

  private get parts(): TimeParts {
    return parseTimeValue(this.value);
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

    this.scrollSelectedIntoView();
    // Focus the first column's selected option, so the arrows work at once.
    panel.querySelector<HTMLButtonElement>('[data-selected="true"]')?.focus();
  }

  private hidePanel() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    const panel = this.panel;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  /**
   * Centres each column on its chosen option.
   *
   * `block: 'nearest'` would leave a column that is already scrolled roughly
   * right alone, which reads as the wrong hour being selected.
   */
  private scrollSelectedIntoView() {
    for (const option of Array.from(
      this.panel?.querySelectorAll<HTMLElement>('[data-selected="true"]') ?? [],
    )) {
      if (typeof option.scrollIntoView === 'function') {
        option.scrollIntoView({ block: 'center' });
      }
    }
  }

  private onToggle = (event: ToggleEvent) => {
    const nowOpen = event.newState === 'open';
    if (this.open !== nowOpen) this.open = nowOpen;
    if (!nowOpen) this.trigger?.focus();
  };

  private commit(next: TimeParts) {
    const value = formatTimeValue(next);
    if (!value || value === this.value) return;
    this.value = value;
    this.pfChange.emit({ value });
  }

  private selectHour(hour: number) {
    const hour24 = this.cycle === 24 ? hour : toHour24(hour, this.selectedMeridiem() ?? 'AM');
    this.commit({ hour: hour24, minute: this.parts.minute ?? 0 });
  }

  private selectMinute(minute: number) {
    this.commit({ hour: this.parts.hour ?? 0, minute });
  }

  private selectMeridiem(meridiem: Meridiem) {
    const { hour, minute } = this.parts;
    this.commit({ hour: toHour24(toHour12(hour ?? 0), meridiem), minute: minute ?? 0 });
  }

  private selectedMeridiem(): Meridiem | null {
    const { hour } = this.parts;
    return hour === null ? null : meridiemOf(hour);
  }

  /**
   * Up and down move within a column, and stop at its ends rather than
   * wrapping — a wrap in a scrolling column of 60 minutes reads as the list
   * having jumped rather than moved.
   *
   * The focused option is read from `shadowRoot.activeElement`, because
   * `document.activeElement` is this host: focus inside a shadow root is
   * reported as the host from the outside.
   */
  private onColumnKeyDown = (event: KeyboardEvent) => {
    if (event.key !== Keys.ArrowDown && event.key !== Keys.ArrowUp) return;

    const column = event.currentTarget as HTMLElement;
    const options = Array.from(column.querySelectorAll<HTMLButtonElement>('button'));
    const index = options.indexOf(this.el.shadowRoot?.activeElement as HTMLButtonElement);
    if (index === -1) return;

    event.preventDefault();
    const next = event.key === Keys.ArrowDown ? index + 1 : index - 1;
    options[Math.min(Math.max(next, 0), options.length - 1)]?.focus();
  };

  private renderColumn(
    name: string,
    options: Array<{ key: string; label: string; selected: boolean; onSelect: () => void }>,
  ) {
    return (
      <div
        class="column"
        part="column"
        role="listbox"
        aria-label={name}
        tabindex={-1}
        onKeyDown={this.onColumnKeyDown}
      >
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            part="option"
            class={{ option: true, 'option--selected': option.selected }}
            role="option"
            aria-selected={option.selected ? 'true' : 'false'}
            data-selected={option.selected ? 'true' : 'false'}
            onClick={option.onSelect}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  render() {
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );
    const { hour, minute } = this.parts;
    const display = formatTimeDisplay(this.parts, this.cycle);
    const shownHour = hour === null ? null : this.cycle === 24 ? hour : toHour12(hour);
    const meridiem = this.selectedMeridiem();

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

          <button
            id="trigger"
            part="trigger"
            class={{ trigger: true, 'trigger--invalid': Boolean(this.error) }}
            type="button"
            disabled={this.disabled}
            aria-haspopup="dialog"
            aria-expanded={this.open ? 'true' : 'false'}
            /* Same shadow root as the panel, so this IDREF resolves. */
            aria-controls="panel"
            aria-invalid={this.error ? 'true' : null}
            aria-required={this.required ? 'true' : null}
            aria-describedby={describedBy}
            onClick={() => {
              if (!this.disabled) this.open = !this.open;
            }}
          >
            <span class={{ value: true, 'value--placeholder': !display }}>
              {display || this.placeholder}
            </span>
            <pf-icon name="clock"></pf-icon>
          </button>

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
          aria-label="Choose a time"
          onToggle={this.onToggle}
        >
          {this.renderColumn(
            'Hour',
            hourOptions(this.cycle).map((option) => ({
              key: `h-${option}`,
              label: padTimePart(option),
              selected: shownHour === option,
              onSelect: () => this.selectHour(option),
            })),
          )}

          {this.renderColumn(
            'Minute',
            timeRange(60, this.minuteStep).map((option) => ({
              key: `m-${option}`,
              label: padTimePart(option),
              selected: minute === option,
              onSelect: () => this.selectMinute(option),
            })),
          )}

          {this.cycle === 12 &&
            this.renderColumn(
              'AM or PM',
              (['AM', 'PM'] as Meridiem[]).map((option) => ({
                key: option,
                label: option,
                selected: meridiem === option,
                onSelect: () => this.selectMeridiem(option),
              })),
            )}
        </div>
      </Host>
    );
  }
}
