import {
  clampToViewport,
  Keys,
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
 * A menu opened by right-clicking the region it wraps.
 *
 * Unlike `pf-dropdown` there is no anchor element — the menu opens at the
 * pointer — so it is placed with core's `clampToViewport` rather than the
 * anchoring observer. The same `pf-menu-item` children serve both.
 *
 * @slot - the region that responds to a right-click.
 * @slot menu - `pf-menu-item` and `pf-menu-separator` children.
 * @part menu - the floating menu panel.
 */
@Component({
  tag: 'pf-context-menu',
  styleUrl: 'pf-context-menu.css',
  shadow: true,
})
export class PfContextMenu {
  @Element() el!: HTMLElement;

  /** Whether the menu is showing. Reflected so the stylesheet can select on it. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Accessible name for the menu. */
  @Prop() label = 'Context menu';

  /**
   * Let the browser's own context menu through instead. Reflected so the
   * stylesheet can select on it.
   */
  @Prop({ reflect: true }) disabled = false;

  /** Fires whenever the menu opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** Fires with the chosen item's value. The menu closes itself afterwards. */
  @Event() pfSelect!: EventEmitter<{ value: string }>;

  /** Where the menu was asked to appear, in client coordinates. */
  private point = { x: 0, y: 0 };

  /** See pf-popover: the watch is the one place every path passes through. */
  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showMenu();
    else this.hideMenu();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  /** Opens the menu at a point in client coordinates. */
  @Method()
  async showAt(x: number, y: number): Promise<void> {
    if (this.disabled) return;
    this.point = { x, y };
    this.open = true;
  }

  /** Closes the menu. */
  @Method()
  async hide(): Promise<void> {
    this.open = false;
  }

  private get panel() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="menu"]') ?? null;
  }

  private get items(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-menu-item'));
  }

  private get enabledItems(): HTMLElement[] {
    return this.items.filter((item) => !item.hasAttribute('disabled'));
  }

  private showMenu() {
    const panel = this.panel;
    if (!panel || panel.matches(':popover-open')) return;

    panel.showPopover();
    /*
     * Measured after showing, because a closed popover has no size and the
     * clamp needs one. Pinned rather than flipped: the pointer is already
     * where the user is looking.
     */
    const { x, y } = clampToViewport(this.point, panel.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    placePopover(panel, x, y);

    const first = this.enabledItems[0];
    syncRovingTabIndex(this.enabledItems, first);
    first?.focus();
  }

  private hideMenu() {
    const panel = this.panel;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  @Listen('contextmenu')
  handleContextMenu(event: MouseEvent) {
    if (this.disabled || event.defaultPrevented) return;
    // Only inside the region, not over the menu itself once it is showing.
    const panel = this.panel;
    if (panel && event.composedPath().includes(panel)) return;

    event.preventDefault();
    this.point = { x: event.clientX, y: event.clientY };
    if (this.open) {
      // Already showing: move it to the new point rather than ignoring.
      this.showMenuAtNewPoint();
      return;
    }
    this.open = true;
  }

  /** A second right-click moves the open menu, which `showMenu` would skip. */
  private showMenuAtNewPoint() {
    const panel = this.panel;
    if (!panel) return;
    const { x, y } = clampToViewport(this.point, panel.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    placePopover(panel, x, y);
  }

  @Listen('pfMenuSelect')
  handleMenuSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    this.pfSelect.emit({ value: event.detail.value });
    this.open = false;
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (!this.open || event.defaultPrevented) return;

    if (event.key === Keys.Escape) {
      event.stopPropagation();
      this.open = false;
      return;
    }

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
        <slot />
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
