import {
  composeDescribedBy,
  findTypeaheadMatch,
  getEnabledIndexes,
  isActivationKey,
  Keys,
  nextTypeaheadBuffer,
  observeAnchoredPosition,
  resolveListMove,
  TYPEAHEAD_TIMEOUT_MS,
  isTypeaheadKey,
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
 * A form-associated single-choice select over `pf-option` children.
 *
 * The first of Wave 5, and the worked example for §2.1: the options are child
 * elements, so a label is a slot and can hold anything, where the React
 * `Select`'s `options` array can only hold a string.
 *
 * **It has typeahead, which the React component does not.** Typing `b` jumps
 * to the next option beginning with `b`, `br` narrows, and `bbb` cycles — the
 * ARIA listbox pattern, and the matching is core's so a later `pf-combobox`
 * answers the same keystrokes. `todo.md` has the React fix.
 *
 * Form-associated, so the value submits by itself. The React component fakes
 * that with a hidden `<input>` beside the trigger.
 *
 * The active option is set as an *element*, not an IDREF: the trigger is in
 * this shadow root and the options are slotted light DOM, and a cross-root
 * IDREF is absent from the accessibility tree — measured. `aria-controls` does
 * work, because the listbox itself is in this same root.
 *
 * @slot - the `pf-option` children.
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part trigger - the combobox button.
 * @part listbox - the floating listbox the options are slotted into.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-select',
  styleUrl: 'pf-select.css',
  formAssociated: true,
  shadow: true,
})
export class PfSelect {
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

  @Prop() placeholder = 'Select an option';

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Options to show before the listbox scrolls. Unset means it fits them all. */
  @Prop() maxVisibleOptions?: number;

  /** Fires when the chosen value changes. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /** Fires whenever the listbox opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** The label of the chosen option, for the trigger to show. */
  @State() selectedLabel = '';

  private initialValue = '';
  private stopObserving?: () => void;
  private activeOption: HTMLElement | null = null;
  private typeahead = '';
  private typeaheadTimer?: ReturnType<typeof setTimeout>;

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
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
  }

  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    this.internals.setFormValue(this.value || null);
    applyControlValidity(this.internals, Boolean(this.value), this.required, this.error);
  }

  /** The value changed, so the children's `selected` and the trigger follow. */
  @Watch('value')
  syncOptions() {
    const options = this.options();
    let label = '';

    for (const option of options) {
      const selected = this.optionValue(option) === this.value && this.value !== '';
      (option as HTMLElement & { selected: boolean }).selected = selected;
      if (selected) label = option.textContent?.trim() ?? '';
    }

    this.selectedLabel = label;
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

  /** A reset restores the value the control started with, not an empty one. */
  formResetCallback() {
    this.value = this.initialValue;
  }

  /** An option added or removed while mounted; re-mark the children. */
  private onSlotChange = () => {
    this.syncOptions();
  };

  /** Re-reads the options, for a label edited in place (which fires no slotchange). */
  @Method()
  async refresh(): Promise<void> {
    this.syncOptions();
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
      // The listbox matches the trigger's width, as the React component does.
      matchAnchorWidth: true,
      flip: true,
      /*
       * `width` *and* `minWidth`: core reports whichever the mode calls for
       * and leaves the other undefined — `matchAnchorWidth: true` gives a
       * `width`, false gives a `minWidth`. Reading only `minWidth`, which is
       * what pf-dropdown needs, left the listbox at its intrinsic 156px beside
       * a 1216px trigger. The smoke test against a real build caught it.
       */
      onChange: ({ left, top, width, minWidth }) => {
        placePopover(panel, left, top);
        if (width !== undefined) panel.style.width = `${width}px`;
        if (minWidth !== undefined) panel.style.minWidth = `${minWidth}px`;
      },
    });

    /*
     * Opens on the chosen option, or the first selectable one. Landing
     * anywhere else would make the arrows start from somewhere the user has
     * no reason to expect.
     */
    const options = this.options();
    const chosen = options.find((option) => this.optionValue(option) === this.value);
    this.setActive(
      chosen && !chosen.hasAttribute('disabled') ? chosen : (this.enabled()[0] ?? null),
    );
  }

  private hideListbox() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    this.clearTypeahead();
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

  /**
   * Feature-detected. Where ARIA element reflection is missing there is no
   * cross-root equivalent, so the active option stops being *announced* while
   * the arrows and Enter still work — recorded in `todo.md`.
   */
  private syncActiveDescendant() {
    const trigger = this.trigger;
    if (!trigger || !('ariaActiveDescendantElement' in trigger)) return;
    (
      trigger as unknown as { ariaActiveDescendantElement: Element | null }
    ).ariaActiveDescendantElement = this.open ? this.activeOption : null;
  }

  private commit(option: HTMLElement) {
    if (option.hasAttribute('disabled')) return;

    const next = this.optionValue(option);
    this.open = false;
    this.trigger?.focus();

    if (next === this.value) return;
    this.value = next;
    this.pfChange.emit({ value: next });
  }

  /** An option asked to be taken. The select decides, reports and closes. */
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
    const options = this.options();
    const enabledIndexes = getEnabledIndexes(options, (option) => option.hasAttribute('disabled'));
    const current = this.activeOption ? options.indexOf(this.activeOption) : -1;
    const next = resolveListMove(action, enabledIndexes, current);
    if (next !== -1) this.setActive(options[next] ?? null);
  }

  private clearTypeahead() {
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = undefined;
    this.typeahead = '';
  }

  /**
   * Typeahead. The buffer and its timer live here, because a timer is state
   * and core is never a state container; the matching is core's.
   */
  private handleTypeahead(key: string) {
    this.typeahead = nextTypeaheadBuffer(this.typeahead, key);

    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => this.clearTypeahead(), TYPEAHEAD_TIMEOUT_MS);

    const options = this.options();
    const labels = options.map((option) => option.textContent ?? '');
    const from = this.activeOption ? options.indexOf(this.activeOption) : -1;
    const match = findTypeaheadMatch(labels, this.typeahead, from, (index) =>
      options[index].hasAttribute('disabled'),
    );

    if (match === -1) return;

    /*
     * Closed, typeahead *chooses* rather than merely highlighting: that is
     * what a native `<select>` does, and with no listbox on screen a
     * highlight nobody can see would be no feedback at all.
     */
    if (this.open) this.setActive(options[match]);
    else this.commit(options[match]);
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (this.disabled || event.defaultPrevented) return;

    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      // Down or Up on a closed select opens it, as a combobox should.
      if (!this.open) this.open = true;
      else this.move(move);
      return;
    }

    if (isActivationKey(event.key)) {
      event.preventDefault();
      if (!this.open) {
        this.open = true;
      } else if (this.activeOption) {
        this.commit(this.activeOption);
      }
      return;
    }

    // Escape is the browser's while the listbox is a `popover="auto"`.
    if (isTypeaheadKey(event.key)) {
      event.preventDefault();
      this.handleTypeahead(event.key);
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
            <span class={{ value: true, 'value--placeholder': !this.selectedLabel }}>
              {this.selectedLabel || this.placeholder}
            </span>
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
