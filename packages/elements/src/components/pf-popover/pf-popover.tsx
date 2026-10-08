import { Keys, observeAnchoredPosition } from '@pitchfork-ui/core';

import { placePopover } from '../../place-popover';
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

/**
 * An interactive panel anchored to its trigger.
 *
 * `popover="auto"` rather than `manual`, because the browser then does
 * light-dismiss and Escape itself — measured from inside a shadow root with
 * trusted input: a real outside click and a real Escape both close an `auto`
 * popover while a `manual` one stays open. That is less code than
 * `onOutsideInteraction` and it composes with the top-layer stack, so a
 * popover inside a popover closes in the right order.
 *
 * @slot - the trigger.
 * @slot content - the panel's content.
 * @part panel - the floating panel.
 */
@Component({
  tag: 'pf-popover',
  styleUrl: 'pf-popover.css',
  shadow: true,
})
export class PfPopover {
  @Element() el!: HTMLElement;

  /** Whether the panel is showing. Reflected so the stylesheet can select on it. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Which edge of the trigger the panel lines up with. */
  @Prop() align: 'start' | 'end' = 'start';

  /** Accessible name for the panel, which is a dialog. */
  @Prop() label?: string;

  /**
   * Close on an outside click or Escape. Defaults to true.
   *
   * This is the `auto`/`manual` popover switch: turning it off hands the
   * consumer responsibility for closing, which is what a popover holding an
   * unfinished form wants.
   */
  @Prop() dismissable = true;

  /** Fires whenever the panel opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  private stopObserving?: () => void;

  componentDidLoad() {
    this.syncTrigger();
    if (this.open) this.showPanel();
  }

  disconnectedCallback() {
    this.stopObserving?.();
  }

  /** Opens the panel. */
  @Method()
  async show(): Promise<void> {
    this.open = true;
  }

  /** Closes the panel. */
  @Method()
  async hide(): Promise<void> {
    this.open = false;
  }

  /**
   * The one place a state change is announced, whatever caused it: a trigger
   * click, `show()`/`hide()`, a consumer writing the prop, or the browser's own
   * light-dismiss mirrored in below.
   *
   * Emitting from the `toggle` handler instead looked right and fired for none
   * of the user-driven paths — by the time `toggle` arrives the click handler
   * has already moved `open`, so the guard there saw no change. A consumer
   * mirroring this value back sets `open` to what it already is, which Stencil
   * does not treat as a change, so there is no loop.
   */
  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showPanel();
    else this.hidePanel();
    this.syncTrigger();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  private get panel() {
    return this.el.shadowRoot?.querySelector<HTMLElement>('[part="panel"]') ?? null;
  }

  private get trigger() {
    return this.el.firstElementChild as HTMLElement | null;
  }

  /**
   * The trigger's disclosure state.
   *
   * `aria-controls` is deliberately absent: it is an IDREF, and an IDREF does
   * not cross a shadow boundary, so pointing it at the panel's id would leave
   * a dangling reference — worse than none. `aria-expanded` and
   * `aria-haspopup` carry what a screen reader announces here.
   */
  private syncTrigger() {
    const trigger = this.trigger;
    if (!trigger) return;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', this.open ? 'true' : 'false');
  }

  private showPanel() {
    const panel = this.panel;
    if (!panel || panel.matches(':popover-open')) return;

    panel.showPopover();
    this.stopObserving?.();
    this.stopObserving = observeAnchoredPosition({
      getAnchor: () => this.trigger,
      getFloating: () => panel,
      align: this.align,
      // A popover sizes to its own content rather than to the trigger, and
      // flips above when there is no room below.
      matchAnchorWidth: false,
      flip: true,
      onChange: ({ left, top }) => placePopover(panel, left, top),
    });

    // The panel is a dialog, so focus belongs inside it once it is showing.
    panel.focus();
  }

  private hidePanel() {
    this.stopObserving?.();
    this.stopObserving = undefined;
    const panel = this.panel;
    if (panel?.matches(':popover-open')) panel.hidePopover();
  }

  @Listen('click')
  handleClick(event: MouseEvent) {
    const trigger = this.trigger;
    // Only the trigger toggles. A click inside the panel is the content's.
    if (!trigger || !event.composedPath().includes(trigger)) return;
    this.open = !this.open;
  }

  /**
   * Escape for the `manual` case only. An `auto` popover is dismissed by the
   * browser, and handling it here as well would fight that.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.key !== Keys.Escape || this.dismissable || !this.open) return;
    event.stopPropagation();
    this.open = false;
  }

  /**
   * Mirrors a change the browser made — light-dismiss, or being closed because
   * another popover took the top layer — back into `open`, which then announces
   * it through the watch above. Without this a consumer's `open` goes stale
   * after a dismiss they did not initiate.
   */
  private onToggle = (event: Event) => {
    const next = (event as ToggleEvent).newState === 'open';
    if (next !== this.open) this.open = next;
  };

  render() {
    return (
      <Host>
        <slot onSlotchange={() => this.syncTrigger()} />
        <div
          class="panel"
          part="panel"
          popover={this.dismissable ? 'auto' : 'manual'}
          role="dialog"
          aria-label={this.label}
          tabindex="-1"
          onToggle={this.onToggle}
        >
          <slot name="content" />
        </div>
      </Host>
    );
  }
}
