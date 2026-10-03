import {
  composeDescribedBy,
  Keys,
  observeAnchoredPosition,
  parseISODate,
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
 * A form-associated date field: a trigger that opens `pf-calendar` in a
 * popover.
 *
 * Form-associated, which the React `DatePicker` is not — it is a button and a
 * portal, so its value reaches a surrounding `<form>` only if the consumer
 * wires it there themselves. Here the value is submitted as `YYYY-MM-DD`,
 * constraint validation works, and Angular's generated accessor has something
 * to bind to.
 *
 * The panel is a `popover`, so light dismiss and Escape are the browser's.
 * Unlike `pf-dropdown`, the trigger and the panel are both in *this* shadow
 * root, so `aria-controls` resolves and is worth setting — a same-root IDREF
 * is the one case that works, measured.
 *
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part trigger - the button that opens the calendar.
 * @part clear - the clear button.
 * @part panel - the floating panel holding the calendar.
 * @part calendar - the calendar itself.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-date-picker',
  styleUrl: 'pf-date-picker.css',
  formAssociated: true,
  shadow: true,
})
export class PfDatePicker {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /**
   * Submitted under this name. Reflected, because the submission name comes
   * from the content attribute and the generated bindings set properties.
   */
  @Prop({ reflect: true }) name?: string;

  /** The selected date as `YYYY-MM-DD`, or empty. */
  @Prop({ mutable: true }) value = '';

  /** Whether the calendar is showing. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Visible label. In the same root as the trigger, so `for` works. */
  @Prop() label?: string;

  /** Hint text below the control. */
  @Prop() description?: string;

  /** Error message. Its presence is what marks the control invalid. */
  @Prop() error?: string;

  @Prop() placeholder = 'Select a date';

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Offer a button that empties the field. */
  @Prop() allowClear = false;

  /** Earliest selectable date, as `YYYY-MM-DD`. */
  @Prop() min?: string;

  /** Latest selectable date, as `YYYY-MM-DD`. */
  @Prop() max?: string;

  @Prop() startYear?: number;

  @Prop() endYear?: number;

  @Prop() showOutsideDays = true;

  /** A predicate for days that cannot be chosen; see `pf-calendar`. */
  @Prop() isDateDisabled?: (date: Date) => boolean;

  /** Fires when a date is chosen or cleared. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /** Fires whenever the calendar opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** What a form reset restores; `value` has been overwritten by then. */
  private initialValue = '';

  private stopObserving?: () => void;

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    this.syncFormState();
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

  /** The one place an open or close is announced, whatever caused it. */
  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showPanel();
    else this.hidePanel();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  /** Opens the calendar. */
  @Method()
  async show(): Promise<void> {
    if (!this.disabled) this.open = true;
  }

  /** Closes the calendar. */
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

  private get panel() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null;
  }

  private get trigger() {
    return this.el.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]') ?? null;
  }

  private get calendar() {
    return (
      this.el.shadowRoot?.querySelector<HTMLElement & { focusSelectedDay(): Promise<void> }>(
        'pf-calendar',
      ) ?? null
    );
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

    // Focus the grid, not the panel: the calendar owns its own tab stop, and
    // it asks for focus through a method rather than having it reached for.
    void this.calendar?.focusSelectedDay();
  }

  private hidePanel() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    const panel = this.panel;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  /**
   * Mirrors a browser-driven close — a light dismiss or Escape — back into
   * `open`, which is what then announces it.
   */
  private onToggle = (event: ToggleEvent) => {
    const nowOpen = event.newState === 'open';
    if (this.open !== nowOpen) this.open = nowOpen;
    if (!nowOpen) this.trigger?.focus();
  };

  /**
   * Listens on the calendar element itself, not on the host.
   *
   * Both were tried. A `@Listen('pfChange')` on the host sees the calendar's
   * event *and* this element's own — a Stencil event is composed, so by then
   * both have been retargeted to the host and `event.target` cannot tell them
   * apart. Worse, `stopPropagation()` there does not help: the consumer's
   * listener is on that same node, and stopping propagation never stops
   * same-node listeners, so every pick reported twice. Caught by a test that
   * counted them.
   *
   * On the calendar, the event is stopped before it reaches the host at all,
   * which does not depend on listener registration order the way
   * `stopImmediatePropagation` would.
   */
  private bindCalendar = (element?: HTMLElement) => {
    if (!element || element === this.boundCalendar) return;
    this.boundCalendar = element;
    element.addEventListener('pfChange', this.onCalendarChange as EventListener);
  };

  private boundCalendar?: HTMLElement;

  private onCalendarChange = (event: CustomEvent<{ value: string }>) => {
    event.stopPropagation();

    this.value = event.detail.value;
    this.pfChange.emit({ value: this.value });
    this.open = false;
    this.trigger?.focus();
  };

  private clear = (event: MouseEvent) => {
    event.stopPropagation();
    if (!this.value) return;
    this.value = '';
    this.pfChange.emit({ value: '' });
  };

  /**
   * Down opens the calendar from a closed trigger, as a popup button should.
   * Escape is the browser's while the panel is open — `popover="auto"` handles
   * it — so there is nothing to do here for it.
   */
  private onTriggerKeyDown = (event: KeyboardEvent) => {
    if (this.open || this.disabled) return;
    if (event.key === Keys.ArrowDown || event.key === Keys.Enter || event.key === Keys.Space) {
      if (event.key === Keys.ArrowDown) {
        event.preventDefault();
        this.open = true;
      }
    }
  };

  /** `MMM D, YYYY`, matching the React component's trigger text. */
  private formatted(): string {
    const date = parseISODate(this.value);
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  render() {
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );
    const text = this.formatted();

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

          <div class="row">
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
              onKeyDown={this.onTriggerKeyDown}
            >
              <span class={{ value: true, 'value--placeholder': !text }}>
                {text || this.placeholder}
              </span>
              <pf-icon name="calendar"></pf-icon>
            </button>

            {this.allowClear && this.value && (
              <button
                class="clear"
                part="clear"
                type="button"
                aria-label="Clear selected date"
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
          aria-label="Choose a date"
          onToggle={this.onToggle}
        >
          <pf-calendar
            ref={this.bindCalendar}
            part="calendar"
            value={this.value || undefined}
            min={this.min}
            max={this.max}
            startYear={this.startYear}
            endYear={this.endYear}
            showOutsideDays={this.showOutsideDays}
            isDateDisabled={this.isDateDisabled}
          ></pf-calendar>
        </div>
      </Host>
    );
  }
}
