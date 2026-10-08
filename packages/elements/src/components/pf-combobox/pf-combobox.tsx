import {
  composeDescribedBy,
  getEnabledIndexes,
  Keys,
  matchesCommandQuery,
  observeAnchoredPosition,
  queryIsEchoedSelection,
  resolveListMove,
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
 * A form-associated combobox: an editable field that filters `pf-option`
 * children.
 *
 * It shares `pf-option` with `pf-select`, which is why the option reads a
 * generic `--pf-option-*` set that each container maps to its own family —
 * the same arrangement as `pf-menu-item` between the two menus.
 *
 * Filtering is core's `matchesCommandQuery`, and so is the rule that a query
 * which is only the chosen label echoed back does not filter: without it,
 * reopening the list to change your mind would show the one answer you already
 * had. Both shared with the React component, which is now rewired to them.
 *
 * Two things the React `Combobox` does not do, both gaps rather than choices:
 * Home and End, and arrows that wrap rather than stop at the ends — which is
 * what `pf-select` does, and one design system should not have two arrow
 * behaviours in neighbouring controls.
 *
 * @slot - the `pf-option` children.
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part control - the box holding the input, clear button and chevron.
 * @part input - the editable field.
 * @part clear - the clear button.
 * @part listbox - the floating listbox the options are slotted into.
 * @part empty - the message shown when nothing matches.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-combobox',
  styleUrl: 'pf-combobox.css',
  formAssociated: true,
  shadow: true,
})
export class PfCombobox {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Submitted under this name. Reflected; the submission reads the attribute. */
  @Prop({ reflect: true }) name?: string;

  /** The chosen option's value, or empty. */
  @Prop({ mutable: true, reflect: true }) value = '';

  /** Whether the listbox is showing. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) open = false;

  @Prop() label?: string;

  @Prop() description?: string;

  @Prop() error?: string;

  @Prop() placeholder = 'Search…';

  /** Shown when the query matches nothing. */
  @Prop() emptyMessage = 'No matches';

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Offer a button that empties the field. */
  @Prop() clearable = true;

  /** Accessible name for that button. */
  @Prop() clearLabel = 'Clear';

  /** Fires when the chosen value changes. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /** Fires whenever the listbox opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** What the field holds, which is not the value until an option is chosen. */
  @State() query = '';

  @State() matchCount = 0;

  private initialValue = '';
  private stopObserving?: () => void;
  private activeOption: HTMLElement | null = null;

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    this.syncFormState();
    this.query = this.selectedLabel();
    this.applyQuery();
  }

  componentDidRender() {
    this.syncActiveDescendant();
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

  /** A value set from outside puts its label in the field and marks the option. */
  @Watch('value')
  syncSelection() {
    for (const option of this.options()) {
      (option as HTMLElement & { selected: boolean }).selected =
        this.optionValue(option) === this.value && this.value !== '';
    }
    this.query = this.selectedLabel();
    this.applyQuery();
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
    this.query = this.selectedLabel();
    this.applyQuery();
  }

  /** Re-reads the options, for a label edited in place (no `slotchange` fires). */
  @Method()
  async refresh(): Promise<void> {
    this.syncSelection();
  }

  private onSlotChange = () => {
    this.syncSelection();
  };

  private options(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-option'));
  }

  private visible(): HTMLElement[] {
    return this.options().filter((option) => !option.hasAttribute('hidden'));
  }

  /** The property, never the attribute: a binding may only have set the former. */
  private optionValue(option: HTMLElement): string {
    return (option as HTMLElement & { value?: string }).value ?? option.getAttribute('value') ?? '';
  }

  private selectedLabel(): string {
    const chosen = this.options().find((option) => this.optionValue(option) === this.value);
    return this.value && chosen ? (chosen.textContent?.trim() ?? '') : '';
  }

  private get listbox() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="listbox"]') ?? null;
  }

  private get input() {
    return this.el.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]') ?? null;
  }

  private get control() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="control"]') ?? null;
  }

  /**
   * Hides the options the query excludes.
   *
   * `hidden` plus `:host([hidden]) { display: none }` on the option, because
   * the attribute alone loses to the option's own `display: block`.
   */
  private applyQuery() {
    const echoed = queryIsEchoedSelection(this.query, this.selectedLabel());
    const options = this.options();

    for (const option of options) {
      const matches =
        echoed || matchesCommandQuery({ label: option.textContent?.trim() ?? '' }, this.query);
      if (matches) option.removeAttribute('hidden');
      else option.setAttribute('hidden', '');
    }

    const visible = this.visible();
    this.matchCount = visible.length;

    // A new query starts at the top of what is left.
    const first = visible.find((option) => !option.hasAttribute('disabled')) ?? null;
    if (!this.activeOption || this.activeOption.hasAttribute('hidden')) this.setActive(first);
  }

  private showListbox() {
    const panel = this.listbox;
    if (this.disabled || !panel || panel.matches(':popover-open')) return;

    panel.showPopover();
    this.stopObserving?.();
    this.stopObserving = observeAnchoredPosition({
      getAnchor: () => this.control,
      getFloating: () => panel,
      matchAnchorWidth: true,
      flip: true,
      onChange: ({ left, top, width, minWidth }) => {
        placePopover(panel, left, top);
        if (width !== undefined) panel.style.width = `${width}px`;
        if (minWidth !== undefined) panel.style.minWidth = `${minWidth}px`;
      },
    });

    this.applyQuery();
  }

  private hideListbox() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    const panel = this.listbox;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  /**
   * A browser-driven close — light dismiss or Escape — reverts the field to
   * the chosen label, so a half-typed query never lingers over a different
   * value. Focus goes back to the input rather than the trigger, because here
   * the input *is* the control.
   */
  private onToggle = (event: ToggleEvent) => {
    const nowOpen = event.newState === 'open';
    if (this.open !== nowOpen) this.open = nowOpen;
    if (!nowOpen) {
      this.query = this.selectedLabel();
      this.applyQuery();
      this.input?.focus();
    }
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

  /**
   * Set as an element, not an IDREF: the input is in this shadow root and the
   * options are slotted light DOM, and a cross-root IDREF is absent from the
   * accessibility tree — measured. Feature-detected, because where element
   * reflection is missing there is no cross-root equivalent.
   */
  private syncActiveDescendant() {
    const input = this.input;
    if (!input || !('ariaActiveDescendantElement' in input)) return;
    (
      input as unknown as { ariaActiveDescendantElement: Element | null }
    ).ariaActiveDescendantElement = this.open ? this.activeOption : null;
  }

  private commit(option: HTMLElement) {
    if (option.hasAttribute('disabled')) return;

    const next = this.optionValue(option);
    this.open = false;

    if (next !== this.value) {
      this.value = next;
      this.pfChange.emit({ value: next });
    }

    // Set after the value, so it is the chosen label rather than the query.
    this.query = this.selectedLabel();
    this.applyQuery();
    this.input?.focus();
  }

  @Listen('pfOptionSelect')
  handleOptionSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    if (this.disabled) return;

    const option = this.options().find(
      (candidate) => this.optionValue(candidate) === event.detail.value,
    );
    if (option) this.commit(option);
  }

  private move(action: ListNavigationAction) {
    const visible = this.visible();
    const enabledIndexes = getEnabledIndexes(visible, (option) => option.hasAttribute('disabled'));
    const current = this.activeOption ? visible.indexOf(this.activeOption) : -1;
    const next = resolveListMove(action, enabledIndexes, current);
    if (next !== -1) this.setActive(visible[next] ?? null);
  }

  private onInput = (event: Event) => {
    this.query = (event.target as HTMLInputElement).value;
    this.applyQuery();
    if (!this.open) this.open = true;
  };

  private clear = () => {
    this.query = '';
    if (this.value !== '') {
      this.value = '';
      this.pfChange.emit({ value: '' });
    }
    this.applyQuery();
    this.open = true;
    this.input?.focus();
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (this.disabled) return;

    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      if (!this.open) this.open = true;
      else this.move(move);
      return;
    }

    /*
     * Enter only commits while the listbox is open. Closed, it is left alone
     * so a combobox inside a form still submits it.
     */
    if (event.key === Keys.Enter && this.open && this.activeOption) {
      event.preventDefault();
      this.commit(this.activeOption);
    }

    // Escape is the browser's: `popover="auto"` closes, and `onToggle` reverts.
  };

  render() {
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );
    const showClear = this.clearable && !this.disabled && (this.query !== '' || this.value !== '');

    return (
      <Host>
        <div class="field" part="field">
          {this.label && (
            <label class="label" part="label" htmlFor="input">
              {this.label}
              {this.required && (
                <span class="required" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          <div class={{ control: true, 'control--invalid': Boolean(this.error) }} part="control">
            <input
              id="input"
              part="input"
              class="input"
              type="text"
              role="combobox"
              autocomplete="off"
              disabled={this.disabled}
              required={this.required}
              placeholder={this.placeholder}
              value={this.query}
              aria-autocomplete="list"
              aria-expanded={this.open ? 'true' : 'false'}
              /* Same shadow root as the listbox, so this IDREF resolves. */
              aria-controls="listbox"
              aria-invalid={this.error ? 'true' : null}
              aria-describedby={describedBy}
              onInput={this.onInput}
              onKeyDown={this.onKeyDown}
              onClick={() => {
                if (!this.disabled) this.open = true;
              }}
            />

            {showClear && (
              <button
                class="clear"
                part="clear"
                type="button"
                aria-label={this.clearLabel}
                /* Out of the tab order, so it never interrupts the keyboard flow. */
                tabindex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={this.clear}
              >
                <pf-icon name="circle-xmark"></pf-icon>
              </button>
            )}

            <span class="chevron" aria-hidden="true">
              <pf-icon name="chevron-down"></pf-icon>
            </span>
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
          id="listbox"
          part="listbox"
          class="listbox"
          popover="auto"
          role="listbox"
          aria-label={this.label ?? this.placeholder}
          onToggle={this.onToggle}
        >
          <slot onSlotchange={this.onSlotChange} />
          {this.matchCount === 0 && (
            <p class="empty" part="empty">
              {this.emptyMessage}
            </p>
          )}
        </div>
      </Host>
    );
  }
}
