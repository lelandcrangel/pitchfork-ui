import {
  composeDescribedBy,
  formatValueList,
  getEnabledIndexes,
  isActivationKey,
  Keys,
  observeAnchoredPosition,
  parseValueList,
  resolveListMove,
  toggleValueInList,
  assertSeparableValues,
  type ListNavigationAction,
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
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';

const MOVES: Record<string, ListNavigationAction> = {
  [Keys.ArrowDown]: 'next',
  [Keys.ArrowUp]: 'previous',
  [Keys.Home]: 'first',
  [Keys.End]: 'last',
};

/**
 * A form-associated multi-choice select over `pf-option` children.
 *
 * **It submits one entry per chosen value from a single control.**
 * `setFormValue` takes a `FormData`, and a key repeated in it is submitted
 * once per value — measured, and the same shape the React component gets from
 * rendering one hidden `<input>` per selection. So a server reads
 * `data.getAll(name)` exactly as it would from a native multiple select.
 *
 * `value` is one comma-separated string, because that is what an attribute can
 * carry; `pfChange` also reports the parsed `values` array, which is what a
 * framework consumer usually wants. A value containing a comma cannot survive
 * that, so one is reported on the console rather than silently mangled.
 *
 * Shares `pf-option` with `pf-select` and `pf-combobox` through the generic
 * `--pf-option-*` set.
 *
 * @slot - the `pf-option` children.
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part trigger - the combobox button.
 * @part chip - each chosen value's chip in the trigger.
 * @part listbox - the floating listbox the options are slotted into.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-multi-select',
  styleUrl: 'pf-multi-select.css',
  formAssociated: true,
  shadow: true,
})
export class PfMultiSelect {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Submitted under this name, once per chosen value. Reflected. */
  @Prop({ reflect: true }) name?: string;

  /** The chosen values, comma-separated. Reflected, so HTML can set it. */
  @Prop({ mutable: true, reflect: true }) value = '';

  /** Whether the listbox is showing. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) open = false;

  @Prop() label?: string;

  @Prop() description?: string;

  @Prop() error?: string;

  @Prop() placeholder = 'Select options';

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Options to show before the listbox scrolls. */
  @Prop() maxVisibleOptions?: number;

  /** Fires when the chosen set changes, with both representations. */
  @Event() pfChange!: EventEmitter<{ value: string; values: string[] }>;

  /** Fires whenever the listbox opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** The labels of the chosen options, for the trigger's chips. */
  @State() chips: string[] = [];

  private initialValue = '';
  private stopObserving?: () => void;
  private activeOption: HTMLElement | null = null;
  private warnedAboutSeparator = false;

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    this.syncFormState();
    this.syncOptions();
  }

  componentDidRender() {
    this.syncActiveDescendant();
  }

  disconnectedCallback() {
    this.stopObserving?.();
  }

  /*
   * `name` is watched here and not on the controls that pass a plain string to
   * `setFormValue`: those take their submission name from the reflected
   * attribute, so the platform picks a change up by itself. This one builds
   * the name *into* a FormData, so without the watch a name assigned after
   * load would never reach the submission.
   */
  @Watch('name')
  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    const values = this.values();

    if (values.length === 0 || !this.name) {
      this.internals.setFormValue(null);
    } else {
      // One entry per value under the one name, which `data.getAll(name)`
      // reads back as an array.
      const data = new FormData();
      for (const value of values) data.append(this.name, value);
      this.internals.setFormValue(data);
    }

    applyControlValidity(this.internals, values.length > 0, this.required, this.error);
  }

  /** The value changed, so the children's `selected` and the chips follow. */
  @Watch('value')
  syncOptions() {
    const chosen = this.values();
    const labels: string[] = [];

    for (const option of this.options()) {
      const selected = chosen.includes(this.optionValue(option));
      (option as HTMLElement & { selected: boolean }).selected = selected;
    }

    // Chips in the order they were chosen, not the options' order.
    for (const value of chosen) {
      const option = this.options().find((candidate) => this.optionValue(candidate) === value);
      if (option) labels.push(option.textContent?.trim() ?? value);
    }

    this.chips = labels;
    this.warnAboutSeparators();
  }

  /**
   * One warning naming every offending value.
   *
   * A value holding a comma cannot round-trip through `value`, and failing
   * silently would show the right chips over a wrong submission.
   */
  private warnAboutSeparators() {
    if (this.warnedAboutSeparator) return;
    const offenders = assertSeparableValues(this.options().map((o) => this.optionValue(o)));
    if (offenders.length === 0) return;

    this.warnedAboutSeparator = true;
    console.warn(
      `[pf-multi-select] option values cannot contain a comma, because \`value\` is a ` +
        `comma-separated list: ${offenders.join(' ')}`,
    );
  }

  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showListbox();
    else this.hideListbox();
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
  }

  /** Re-reads the options, for a label edited in place. */
  @Method()
  async refresh(): Promise<void> {
    this.syncOptions();
  }

  private onSlotChange = () => {
    this.syncOptions();
  };

  private values(): string[] {
    return parseValueList(this.value);
  }

  private options(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-option'));
  }

  private enabled(): HTMLElement[] {
    return this.options().filter((option) => !option.hasAttribute('disabled'));
  }

  /** The property, never the attribute: a binding may only have set the former. */
  private optionValue(option: HTMLElement): string {
    return (option as HTMLElement & { value?: string }).value ?? option.getAttribute('value') ?? '';
  }

  private get listbox() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="listbox"]') ?? null;
  }

  private get trigger() {
    return this.el.shadowRoot?.querySelector<HTMLButtonElement>('[part="trigger"]') ?? null;
  }

  private showListbox() {
    const panel = this.listbox;
    if (this.disabled || !panel || panel.matches(':popover-open')) return;

    panel.showPopover();
    this.stopObserving?.();
    this.stopObserving = observeAnchoredPosition({
      getAnchor: () => this.trigger,
      getFloating: () => panel,
      matchAnchorWidth: true,
      flip: true,
      onChange: ({ left, top, width, minWidth }) => {
        placePopover(panel, left, top);
        if (width !== undefined) panel.style.width = `${width}px`;
        if (minWidth !== undefined) panel.style.minWidth = `${minWidth}px`;
      },
    });

    // Opens on the first chosen option, or the first selectable one.
    const chosen = this.values();
    const first =
      this.options().find(
        (option) => chosen.includes(this.optionValue(option)) && !option.hasAttribute('disabled'),
      ) ?? this.enabled()[0];
    this.setActive(first ?? null);
  }

  private hideListbox() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    const panel = this.listbox;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  private onToggle = (event: ToggleEvent) => {
    const nowOpen = event.newState === 'open';
    if (this.open !== nowOpen) this.open = nowOpen;
    if (!nowOpen) this.trigger?.focus();
  };

  private setActive(option: HTMLElement | null) {
    for (const other of this.options()) {
      if (other !== option) (other as HTMLElement & { active: boolean }).active = false;
    }
    if (option) (option as HTMLElement & { active: boolean }).active = true;

    this.activeOption = option;
    this.syncActiveDescendant();
    if (option && typeof option.scrollIntoView === 'function') {
      option.scrollIntoView({ block: 'nearest' });
    }
  }

  /** An element, not an IDREF: a cross-root IDREF resolves to nothing. */
  private syncActiveDescendant() {
    const trigger = this.trigger;
    if (!trigger || !('ariaActiveDescendantElement' in trigger)) return;
    (
      trigger as unknown as { ariaActiveDescendantElement: Element | null }
    ).ariaActiveDescendantElement = this.open ? this.activeOption : null;
  }

  /**
   * Toggles one value and keeps the listbox open — the difference from
   * `pf-select`, and the whole point of a multi-choice control: closing after
   * each pick would make choosing three things three round trips.
   */
  private toggle(option: HTMLElement) {
    if (option.hasAttribute('disabled') || this.disabled) return;

    const next = toggleValueInList(this.values(), this.optionValue(option));
    this.value = formatValueList(next);
    this.pfChange.emit({ value: this.value, values: next });
  }

  @Listen('pfOptionSelect')
  handleOptionSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    const option = this.options().find(
      (candidate) => this.optionValue(candidate) === event.detail.value,
    );
    if (option) this.toggle(option);
  }

  private move(action: ListNavigationAction) {
    const options = this.options();
    const enabledIndexes = getEnabledIndexes(options, (option) => option.hasAttribute('disabled'));
    const current = this.activeOption ? options.indexOf(this.activeOption) : -1;
    const next = resolveListMove(action, enabledIndexes, current);
    if (next !== -1) this.setActive(options[next] ?? null);
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (this.disabled || event.defaultPrevented) return;

    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      if (!this.open) this.open = true;
      else this.move(move);
      return;
    }

    if (isActivationKey(event.key)) {
      event.preventDefault();
      if (!this.open) this.open = true;
      else if (this.activeOption) this.toggle(this.activeOption);
    }
  }

  render() {
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );

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
            role="combobox"
            disabled={this.disabled}
            aria-haspopup="listbox"
            aria-expanded={this.open ? 'true' : 'false'}
            /* Same shadow root as the listbox, so this IDREF resolves. */
            aria-controls="listbox"
            aria-invalid={this.error ? 'true' : null}
            aria-required={this.required ? 'true' : null}
            aria-describedby={describedBy}
            onClick={() => {
              if (!this.disabled) this.open = !this.open;
            }}
          >
            {this.chips.length > 0 ? (
              <span class="chips">
                {this.chips.map((chip) => (
                  <span key={chip} class="chip" part="chip">
                    {chip}
                  </span>
                ))}
              </span>
            ) : (
              <span class="placeholder">{this.placeholder}</span>
            )}
            <span class="chevron" aria-hidden="true">
              <pf-icon name="chevron-down"></pf-icon>
            </span>
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
          id="listbox"
          part="listbox"
          class="listbox"
          popover="auto"
          role="listbox"
          /* The one ARIA difference from pf-select, and the important one. */
          aria-multiselectable="true"
          aria-label={this.label ?? this.placeholder}
          style={
            this.maxVisibleOptions
              ? { maxHeight: `calc(${this.maxVisibleOptions} * 36px)`, overflowY: 'auto' }
              : undefined
          }
          onToggle={this.onToggle}
        >
          <slot onSlotchange={this.onSlotChange} />
        </div>
      </Host>
    );
  }
}
