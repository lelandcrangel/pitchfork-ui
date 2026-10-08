import {
  getEnabledIndexes,
  Keys,
  lockPageScroll,
  matchesCommandQuery,
  resolveListMove,
  type ListNavigationAction,
} from '@pitchfork-ui/core';

import {
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

/*
 * `toggleAttribute` does not exist on Stencil's mock DOM -- measured, and
 * worth knowing how it fails: Stencil's `safeCall` swallows the TypeError, so
 * the filter silently did nothing and the palette rendered "No results found"
 * over a full list. Not exported, so this file still has one export.
 */
const setHidden = (element: Element, hidden: boolean) => {
  if (hidden) element.setAttribute('hidden', '');
  else element.removeAttribute('hidden');
};

/**
 * A searchable command list in a modal dialog.
 *
 * A native `<dialog>` opened with `showModal()`, like `pf-modal` and
 * `pf-slideout-menu`: the focus trap, Escape and the backdrop come free, and
 * the React component's `useFocusTrap` has no equivalent here. Page scroll is
 * the one part the dialog does not do, so that is core's reference-counted
 * lock.
 *
 * **The active option is set as an element, not an IDREF.** The input lives in
 * this shadow root and the options are slotted light-DOM children, and
 * `aria-activedescendant` does not cross a shadow boundary — measured against
 * Chromium's accessibility tree, where a cross-root IDREF is simply absent
 * from it. `ariaActiveDescendantElement` does resolve, because the option sits
 * in an ancestor scope of the input's tree, which is the direction element
 * reflection allows. (`pf-tooltip` needed the opposite direction — a trigger
 * referencing something inside a shadow root it does not own — and that one
 * reads back empty, which is why it copies text into `aria-description`
 * instead.)
 *
 * @slot - `pf-command-item` and `pf-command-group` children.
 * @part dialog - the native dialog, which is also the backdrop.
 * @part panel - the floating panel.
 * @part input - the search input.
 * @part list - the listbox the items are slotted into.
 * @part empty - the message shown when nothing matches.
 */
@Component({
  tag: 'pf-command-palette',
  styleUrl: 'pf-command-palette.css',
  shadow: true,
})
export class PfCommandPalette {
  @Element() el!: HTMLElement;

  /** Whether the palette is showing. Reflected so the stylesheet selects on it. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Placeholder for the search input. */
  @Prop() placeholder = 'Search commands…';

  /** Shown when the query matches nothing. */
  @Prop() emptyMessage = 'No results found.';

  /** Accessible name for the dialog. */
  @Prop() label = 'Command palette';

  /** Close on Escape or a click on the backdrop. Defaults to true. */
  @Prop() dismissable = true;

  /** Fires whenever the palette opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** Fires with the chosen item's `value`. The palette then closes. */
  @Event() pfSelect!: EventEmitter<{ value: string }>;

  @State() query = '';
  @State() matchCount = 0;

  private releaseScroll: (() => void) | null = null;
  private activeItem: HTMLElement | null = null;

  /*
   * Read the light DOM on the way in, not after mounting, so the first paint
   * is right: filtering from `componentDidLoad` leaves `matchCount` at 0 for
   * that first render and flashes "No results found" over a full list.
   */
  componentWillLoad() {
    this.applyQuery();
  }

  componentDidLoad() {
    if (this.open) this.showDialog();
  }

  componentDidRender() {
    /*
     * Re-applied after every render because the active option is held as a
     * *property* on the input, and Stencil's re-render replaces nothing of the
     * light DOM but does reset nothing of this either — the property survives,
     * but the matching set may have changed under it, so the one place that is
     * always right is after the render that changed it.
     */
    this.syncActiveDescendant();
  }

  disconnectedCallback() {
    this.unlockScroll();
  }

  /** Opens the palette. */
  @Method()
  async show(): Promise<void> {
    this.open = true;
  }

  /** Closes the palette. */
  @Method()
  async hide(): Promise<void> {
    this.open = false;
  }

  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showDialog();
    else this.closeDialog();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  /** A child asking to be run. The palette decides, reports and closes. */
  @Listen('pfCommandSelect')
  handleCommandSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    this.pfSelect.emit({ value: event.detail.value });
    this.open = false;
  }

  /*
   * Items may be added, removed or relabelled while the palette is open, so
   * the filter is re-applied when the assignment changes. Text edited inside
   * an already-assigned node does not fire this — the same caveat pf-tooltip
   * documents — which is why `refresh()` exists.
   */
  private onSlotChange = () => {
    this.applyQuery();
  };

  /** Re-reads the children and re-applies the current query. */
  @Method()
  async refresh(): Promise<void> {
    this.applyQuery();
  }

  private get dialog() {
    return this.el.shadowRoot?.querySelector('dialog') ?? null;
  }

  private get input() {
    return this.el.shadowRoot?.querySelector('input') ?? null;
  }

  private items(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-command-item'));
  }

  /** The items a query left showing, which is what the arrows move through. */
  private visibleItems(): HTMLElement[] {
    return this.items().filter((item) => !item.hasAttribute('hidden'));
  }

  private lockScroll() {
    if (this.releaseScroll) return;
    this.releaseScroll = lockPageScroll();
  }

  private unlockScroll() {
    this.releaseScroll?.();
    this.releaseScroll = null;
  }

  private showDialog() {
    const dialog = this.dialog;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    this.lockScroll();

    // A fresh query each time it opens, matching the React component.
    this.query = '';
    this.applyQuery();
    requestAnimationFrame(() => this.input?.focus());
  }

  private closeDialog() {
    const dialog = this.dialog;
    this.unlockScroll();
    if (dialog?.open) dialog.close();
  }

  private onCancel = (event: Event) => {
    if (!this.dismissable) event.preventDefault();
  };

  private onClose = () => {
    this.unlockScroll();
    if (this.open) this.open = false;
  };

  /** A click on the dialog itself landed on the backdrop, not the panel. */
  private onDialogClick = (event: MouseEvent) => {
    if (!this.dismissable || event.target !== this.dialog) return;
    this.open = false;
  };

  private onInput = (event: Event) => {
    this.query = (event.target as HTMLInputElement).value;
    this.applyQuery();
  };

  /**
   * Hides the items a query excludes, and any group left with none showing.
   *
   * The group's own label counts towards each of its items, so typing a
   * section name narrows to that section — which is what the React component
   * does with its `group` field.
   */
  private applyQuery() {
    const query = this.query;

    for (const item of this.items()) {
      const group = item.closest('pf-command-group');
      const matches = matchesCommandQuery(
        {
          label: item.textContent?.trim() ?? '',
          description: item.getAttribute('description'),
          group: group?.getAttribute('label') ?? null,
        },
        query,
      );
      setHidden(item, !matches);
    }

    for (const group of Array.from(this.el.querySelectorAll<HTMLElement>('pf-command-group'))) {
      const showing = group.querySelectorAll('pf-command-item:not([hidden])').length;
      setHidden(group, showing === 0);
    }

    const visible = this.visibleItems();
    this.matchCount = visible.length;

    // A new query starts at the top, as the React component does.
    this.setActive(visible.find((item) => !item.hasAttribute('disabled')) ?? null);
  }

  private setActive(item: HTMLElement | null) {
    if (this.activeItem && this.activeItem !== item) {
      this.activeItem.removeAttribute('aria-selected');
    }
    this.activeItem = item;
    item?.setAttribute('aria-selected', 'true');
    this.syncActiveDescendant();
    // Guarded: this also runs from componentWillLoad, and the mock DOM has no
    // scrollIntoView at all.
    if (item && typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({ block: 'nearest' });
    }
  }

  /**
   * Feature-detected: where ARIA element reflection is missing there is no
   * cross-root equivalent, so the active option stops being *announced* while
   * the arrows, the highlight and Enter all still work. Recorded in `todo.md`.
   */
  private syncActiveDescendant() {
    const input = this.input;
    if (!input || !('ariaActiveDescendantElement' in input)) return;
    (
      input as unknown as { ariaActiveDescendantElement: Element | null }
    ).ariaActiveDescendantElement = this.activeItem;
  }

  private move(action: ListNavigationAction) {
    const visible = this.visibleItems();
    const enabled = getEnabledIndexes(visible, (item) => item.hasAttribute('disabled'));
    const current = this.activeItem ? visible.indexOf(this.activeItem) : -1;
    const next = resolveListMove(action, enabled, current);
    if (next !== -1) this.setActive(visible[next] ?? null);
  }

  private runActive() {
    const item = this.activeItem;
    if (!item || item.hasAttribute('disabled')) return;
    // The property, not the attribute: a binding that sets props would leave
    // the attribute absent, and the reported value silently empty.
    const value = (item as HTMLElement & { value?: string }).value;
    this.pfSelect.emit({ value: value ?? item.getAttribute('value') ?? '' });
    this.open = false;
  }

  /*
   * On the panel rather than the input, so a pointer that has moved focus
   * elsewhere inside the dialog still drives the list. Escape is left to the
   * dialog, which handles it natively.
   */
  private onKeyDown = (event: KeyboardEvent) => {
    const actions: Record<string, ListNavigationAction> = {
      [Keys.ArrowDown]: 'next',
      [Keys.ArrowUp]: 'previous',
      [Keys.Home]: 'first',
      [Keys.End]: 'last',
    };

    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      this.move(action);
      return;
    }

    if (event.key === Keys.Enter) {
      event.preventDefault();
      this.runActive();
    }
  };

  render() {
    const empty = this.matchCount === 0;

    return (
      <Host>
        <dialog
          part="dialog"
          class="dialog"
          aria-label={this.label}
          onCancel={this.onCancel}
          onClose={this.onClose}
          onClick={this.onDialogClick}
        >
          <div class="panel" part="panel" onKeyDown={this.onKeyDown}>
            <div class="search">
              <pf-icon name="magnifying-glass" class="search-icon"></pf-icon>
              <input
                part="input"
                class="input"
                type="text"
                role="combobox"
                autocomplete="off"
                spellcheck={false}
                aria-autocomplete="list"
                aria-expanded="true"
                aria-label={this.placeholder}
                placeholder={this.placeholder}
                value={this.query}
                onInput={this.onInput}
              />
              <pf-kbd class="hint">esc</pf-kbd>
            </div>

            <div class="list" part="list" role="listbox" aria-label={this.label}>
              <slot onSlotchange={this.onSlotChange} />
              {empty && (
                <p class="empty" part="empty">
                  {this.emptyMessage}
                </p>
              )}
            </div>
          </div>
        </dialog>
      </Host>
    );
  }
}
