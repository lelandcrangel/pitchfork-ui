import {
  Keys,
  observeAnchoredPosition,
  resolveListMove,
  resolveRovingKey,
  syncRovingTabIndex,
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
  Watch,
} from '@stencil/core';

import { placePopover } from '../../place-popover';

/**
 * A menu of actions, anchored to a trigger.
 *
 * `popover="auto"`, so light-dismiss and Escape are the browser's, as in
 * `pf-popover`. The keyboard pattern is the ARIA menu one and reuses core's
 * roving module — its third consumer, after `pf-toolbar` and
 * `pf-radio-group` — because the items are custom elements rather than native
 * controls and have to be queried by tag.
 *
 * @slot - the trigger.
 * @slot menu - `pf-menu-item` and `pf-menu-separator` children.
 * @part menu - the floating menu panel.
 */
@Component({
  tag: 'pf-dropdown',
  styleUrl: 'pf-dropdown.css',
  shadow: true,
})
export class PfDropdown {
  @Element() el!: HTMLElement;

  /** Whether the menu is showing. Reflected so the stylesheet can select on it. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Which edge of the trigger the menu lines up with. */
  @Prop() align: 'start' | 'end' = 'start';

  /** Accessible name for the menu. */
  @Prop() label = 'Actions';

  /** Prevent opening. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) disabled = false;

  /** Fires whenever the menu opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** Fires with the chosen item's value. The menu closes itself afterwards. */
  @Event() pfSelect!: EventEmitter<{ value: string }>;

  private stopObserving?: () => void;

  componentDidLoad() {
    this.syncTrigger();
    if (this.open) this.showMenu();
  }

  disconnectedCallback() {
    this.stopObserving?.();
  }

  /** Opens the menu. */
  @Method()
  async show(): Promise<void> {
    if (!this.disabled) this.open = true;
  }

  /** Closes the menu. */
  @Method()
  async hide(): Promise<void> {
    this.open = false;
  }

  /** See pf-popover: the watch is the one place every path passes through. */
  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showMenu();
    else this.hideMenu();
    this.syncTrigger();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  private get panel() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="menu"]') ?? null;
  }

  private get trigger() {
    return this.el.firstElementChild as HTMLElement | null;
  }

  /** The actionable items, in source order. Separators are not items. */
  private get items(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-menu-item'));
  }

  private get enabledItems(): HTMLElement[] {
    return this.items.filter((item) => !item.hasAttribute('disabled'));
  }

  /**
   * `aria-controls` is absent on purpose: an IDREF does not cross a shadow
   * boundary, so pointing it at the panel would dangle. `aria-haspopup` and
   * `aria-expanded` carry what is announced.
   */
  private syncTrigger() {
    const trigger = this.trigger;
    if (!trigger) return;
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', this.open ? 'true' : 'false');
  }

  private showMenu() {
    const panel = this.panel;
    if (this.disabled || !panel || panel.matches(':popover-open')) return;

    panel.showPopover();
    this.stopObserving?.();
    this.stopObserving = observeAnchoredPosition({
      getAnchor: () => this.trigger,
      getFloating: () => panel,
      align: this.align,
      matchAnchorWidth: false,
      minWidth: 200,
      flip: true,
      onChange: ({ left, top, minWidth }) => {
        placePopover(panel, left, top);
        if (minWidth !== undefined) panel.style.minWidth = `${minWidth}px`;
      },
    });

    // The ARIA menu pattern puts focus on the first item, not on the menu.
    const first = this.enabledItems[0];
    syncRovingTabIndex(this.enabledItems, first);
    first?.focus();
  }

  private hideMenu() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    const panel = this.panel;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  @Listen('click')
  handleClick(event: MouseEvent) {
    const trigger = this.trigger;
    if (!trigger || !event.composedPath().includes(trigger)) return;
    if (this.disabled) return;
    this.open = !this.open;
  }

  /**
   * An item asked to be acted on. The menu reports it and closes, which is
   * what makes `pf-menu-item` reusable: it knows nothing about its container.
   */
  @Listen('pfMenuSelect')
  handleMenuSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    this.pfSelect.emit({ value: event.detail.value });
    this.open = false;
    this.trigger?.focus();
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    // Down on a closed trigger opens the menu, as a menu button should.
    if (!this.open) {
      if (event.key === Keys.ArrowDown && !this.disabled) {
        event.preventDefault();
        this.open = true;
      }
      return;
    }

    if (event.key === Keys.Escape) {
      event.stopPropagation();
      this.open = false;
      this.trigger?.focus();
      return;
    }

    // A menu is a column, so navigation is always the vertical axis.
    const action = resolveRovingKey(event.key, 'vertical');
    if (!action) return;

    const items = this.enabledItems;
    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const nextIndex = resolveListMove(
      action,
      items.map((_, index) => index),
      currentIndex,
    );
    if (nextIndex < 0) return;

    event.preventDefault();
    syncRovingTabIndex(items, items[nextIndex]);
    items[nextIndex].focus();
  }

  private onToggle = (event: Event) => {
    const next = (event as ToggleEvent).newState === 'open';
    if (next !== this.open) this.open = next;
  };

  render() {
    return (
      <Host>
        <slot onSlotchange={() => this.syncTrigger()} />
        <div
          class="menu"
          part="menu"
          popover="auto"
          role="menu"
          aria-label={this.label}
          onToggle={this.onToggle}
        >
          <slot name="menu" />
        </div>
      </Host>
    );
  }
}
