import {
  getRovingItems,
  resolveListMove,
  resolveRovingKey,
  syncRovingTabIndex,
} from '@pitchfork-ui/core';
import { Component, Element, h, Host, Listen, Prop, Watch } from '@stencil/core';

export type PfToolbarOrientation = 'horizontal' | 'vertical';

/**
 * A group of controls that is one tab stop from outside and navigated
 * internally with the arrow keys.
 *
 * Items are matched in the light DOM, so a native `button`, `a[href]` or form
 * control works with no ceremony. A custom element is not a native control and
 * has to opt in with `data-toolbar-item` — `<pf-button data-toolbar-item>`.
 * Focusing it still reaches the real button inside, because `pf-button`
 * delegates focus.
 *
 * @slot - the toolbar's controls, and any `pf-toolbar-separator` between them.
 */
@Component({
  tag: 'pf-toolbar',
  styleUrl: 'pf-toolbar.css',
  shadow: true,
})
export class PfToolbar {
  @Element() el!: HTMLElement;

  /** Layout and arrow-key axis. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) orientation: PfToolbarOrientation = 'horizontal';

  componentDidLoad() {
    this.sync();
  }

  /**
   * A separator cannot see which way its toolbar runs: `:host-context()` is the
   * only selector that would reach out of its shadow root, and it is not
   * supported in Firefox or Safari. So the toolbar pushes its own orientation
   * down instead, which also means a consumer never has to set it twice.
   */
  @Watch('orientation')
  sync() {
    syncRovingTabIndex(getRovingItems(this.el));

    for (const separator of Array.from(this.el.querySelectorAll('pf-toolbar-separator'))) {
      separator.setAttribute('orientation', this.orientation);
    }
  }

  /**
   * Keeps the tab stop on whatever the user actually focused, however they got
   * there — a click, a Tab from outside, or a script.
   *
   * `focusin` rather than `focus` because it bubbles, and it crosses a shadow
   * boundary with its target retargeted to the host, which is exactly the
   * element in the item list.
   */
  @Listen('focusin')
  handleFocusIn(event: FocusEvent) {
    syncRovingTabIndex(getRovingItems(this.el), event.target as HTMLElement);
  }

  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    const action = resolveRovingKey(event.key, this.orientation);
    if (!action) return;

    const items = getRovingItems(this.el);
    // activeElement reports the shallowest host, which is the item itself even
    // when focus has been delegated into its shadow root.
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    const nextIndex = resolveListMove(
      action,
      items.map((_, index) => index),
      currentIndex,
    );
    if (nextIndex >= 0) {
      event.preventDefault();
      items[nextIndex].focus();
    }
  }

  render() {
    return (
      <Host role="toolbar" aria-orientation={this.orientation}>
        <slot onSlotchange={() => this.sync()} />
      </Host>
    );
  }
}
