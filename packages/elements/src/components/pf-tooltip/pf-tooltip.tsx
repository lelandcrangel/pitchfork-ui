import { Keys, observeSidePosition, type Side } from '@pitchfork-ui/core';

import { placePopover } from '../../place-popover';
import { Component, Element, h, Host, Listen, Prop, State, Watch } from '@stencil/core';

/**
 * A tooltip anchored to whatever is slotted into it.
 *
 * The panel is a `popover`, which is how it escapes an ancestor's `overflow`
 * and stacking context — the thing `createPortal` does for the React
 * component, and the only equivalent available from inside a shadow root.
 * Verified: a popover opened from a shadow root inside an `overflow: hidden`
 * container beats a `z-index: 999` sibling, where a plain absolute element in
 * the same place loses.
 *
 * @slot - the trigger.
 * @slot content - the tooltip's content. Its text also becomes the trigger's
 * accessible description.
 * @part tooltip - the floating panel.
 */
@Component({
  tag: 'pf-tooltip',
  styleUrl: 'pf-tooltip.css',
  shadow: true,
})
export class PfTooltip {
  @Element() el!: HTMLElement;

  /** Preferred side. Reflected so the stylesheet can place the arrow. */
  @Prop({ reflect: true }) placement: Side = 'top';

  /** Milliseconds to wait before showing on hover or focus. */
  @Prop() delay = 120;

  /** Force the tooltip open or closed, rather than letting it react. */
  @Prop() open?: boolean;

  /** Never show. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) disabled = false;

  /** The side actually in use, which the arrow follows. */
  @State() resolvedSide: Side = 'top';

  private showTimer?: number;
  private stopObserving?: () => void;
  private contentObserver?: MutationObserver;

  componentDidLoad() {
    this.watchContent();
    this.syncDescription();
    if (this.open) this.show();
  }

  disconnectedCallback() {
    this.clearTimer();
    this.stopObserving?.();
    this.contentObserver?.disconnect();
  }

  /**
   * `slotchange` fires when the *assignment* changes, not when text inside an
   * already-assigned node is edited — so a consumer setting
   * `span.textContent = 'Changed'` would update the visible tooltip and leave
   * the trigger's accessible description stale. That is a silent
   * accessibility bug rather than a cosmetic one, which is what earns the
   * observer.
   */
  private watchContent() {
    this.contentObserver?.disconnect();
    this.contentObserver = new MutationObserver(() => this.syncDescription());
    this.contentObserver.observe(this.el, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  /**
   * The trigger's accessible description, copied as text.
   *
   * It cannot be an IDREF: `aria-describedby` does not cross a shadow
   * boundary, and `ariaDescribedByElements` silently reads back empty when
   * handed an element from a root the trigger does not own — both measured.
   * `aria-description` is a plain string, so it crosses nothing, and the
   * accessibility tree reports it identically to a same-root IDREF.
   */
  private syncDescription() {
    const trigger = this.el.firstElementChild;
    if (!trigger) return;

    const slot = this.el.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="content"]');
    const text = slot
      ?.assignedNodes({ flatten: true })
      .map((node) => node.textContent ?? '')
      .join(' ')
      .trim();

    if (text) trigger.setAttribute('aria-description', text);
    else trigger.removeAttribute('aria-description');
  }

  @Watch('open')
  syncOpen(next?: boolean) {
    if (next) this.show();
    else if (next === false) this.hide();
  }

  private get panel() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="tooltip"]') ?? null;
  }

  private clearTimer() {
    if (this.showTimer !== undefined) {
      window.clearTimeout(this.showTimer);
      this.showTimer = undefined;
    }
  }

  private show() {
    const panel = this.panel;
    if (this.disabled || !panel || panel.matches(':popover-open')) return;

    panel.showPopover();
    /*
     * Positioning waits until the panel is open, because the side is chosen by
     * how the panel's own size fits the viewport and a closed popover has no
     * size at all.
     */
    this.stopObserving?.();
    this.stopObserving = observeSidePosition({
      getAnchor: () => this.el.firstElementChild as HTMLElement | null,
      getFloating: () => panel,
      side: this.placement,
      onChange: ({ side, left, top }) => {
        this.resolvedSide = side;
        placePopover(panel, left, top);
      },
    });
  }

  private hide() {
    this.clearTimer();
    this.stopObserving?.();
    this.stopObserving = undefined;
    const panel = this.panel;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  /** Controlled mode means the consumer decides; hover and focus do nothing. */
  private get isControlled() {
    return this.open !== undefined;
  }

  private scheduleShow = () => {
    if (this.disabled || this.isControlled) return;
    this.clearTimer();
    this.showTimer = window.setTimeout(() => this.show(), this.delay);
  };

  private cancel = () => {
    if (this.isControlled) return;
    this.hide();
  };

  @Listen('pointerenter')
  handlePointerEnter() {
    this.scheduleShow();
  }

  @Listen('pointerleave')
  handlePointerLeave() {
    this.cancel();
  }

  /** `focusin`/`focusout` rather than `focus`/`blur`, so they bubble. */
  @Listen('focusin')
  handleFocusIn() {
    this.scheduleShow();
  }

  @Listen('focusout')
  handleFocusOut() {
    this.cancel();
  }

  /**
   * Escape dismisses even in controlled mode. A tooltip covering the content
   * you are trying to read is not something to need a prop for, and WAI-ARIA
   * requires it of any tooltip.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.key !== Keys.Escape) return;
    const panel = this.panel;
    if (!panel?.matches(':popover-open')) return;
    event.stopPropagation();
    this.hide();
  }

  render() {
    return (
      <Host>
        <slot onSlotchange={() => this.syncDescription()} />
        <div
          class="tooltip"
          part="tooltip"
          popover="manual"
          role="tooltip"
          data-side={this.resolvedSide}
        >
          <slot name="content" onSlotchange={() => this.syncDescription()} />
        </div>
      </Host>
    );
  }
}
