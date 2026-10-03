import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  State,
} from '@stencil/core';

export type PfInlineCtaTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

/**
 * A prompt in the flow of a page: an icon, a line or two, something to do, and
 * optionally a way to send it away.
 *
 * Dismissal waits on `Animation.finished` rather than a timeout. The React
 * `useExitAnimation` guesses 220ms and calls back then, which is wrong twice
 * over: it fires too early or too late if the stylesheet's duration changes,
 * and it fires at all when nothing animated. Reading `getAnimations()` after a
 * frame answers both — the same arrangement `pf-notification.dismiss()` uses,
 * and for the same measured reason: an `animationend` listener never fires
 * when no animation started, which is the ordinary case under
 * `prefers-reduced-motion` or with the stylesheet unloaded.
 *
 * @slot - the heading.
 * @slot description - a line below the heading.
 * @slot action - what to do about it, usually a button.
 * @slot icon - an icon, in place of the `icon` name.
 * @part icon - the icon's box.
 * @part heading - the heading's box.
 * @part content - the box holding the heading and the description.
 * @part action - the box holding the action slot.
 * @part dismiss - the dismiss button, when `dismissible` is set.
 */
@Component({
  tag: 'pf-inline-cta',
  styleUrl: 'pf-inline-cta.css',
  shadow: true,
})
export class PfInlineCta {
  @Element() el!: HTMLElement;

  /** Colour treatment. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) tone: PfInlineCtaTone = 'default';

  /** An icon name from the same registry as `pf-icon`. */
  @Prop() icon = 'circle-question';

  /** Offer a dismiss button. Reflected: it changes the padding. */
  @Prop({ reflect: true }) dismissible = false;

  /** The dismiss button's accessible name. */
  @Prop() dismissLabel = 'Dismiss';

  /** Fires once the prompt has finished leaving. */
  @Event() pfDismiss!: EventEmitter<void>;

  /** Whether the exit animation is running. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) exiting = false;

  /** Whether anything is slotted into the boxes that carry layout. */
  @State() hasIcon = false;
  @State() hasAction = false;

  /** Read from the light DOM, so first paint is right without `slotchange`. */
  componentWillLoad() {
    this.read();
  }

  private read = () => {
    const slotted = (name: string) =>
      Array.from(this.el.children).some((child) => child.getAttribute('slot') === name);

    this.hasIcon = slotted('icon');
    this.hasAction = slotted('action');
  };

  /**
   * Plays the exit animation and resolves once it has finished, then reports.
   *
   * `getAnimations()` read after a frame, so the class the stylesheet animates
   * has landed; an empty list resolves at once, which is what makes this
   * correct with no stylesheet, under `prefers-reduced-motion`, and in both
   * test projects.
   */
  @Method()
  async dismiss(): Promise<void> {
    if (this.exiting) return;
    this.exiting = true;

    // A frame, so the reflected `exiting` attribute has landed and the
    // animation it starts has actually been created.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await this.waitForExit();

    this.pfDismiss.emit();
  }

  /**
   * Waits for the exit animation, or returns straight away when there is not
   * one.
   *
   * The `typeof` guard is for the mock DOM, which has no `getAnimations` at
   * all — one more of its gaps, alongside the missing `toggleAttribute`. It
   * surfaced here rather than vanishing because a `TypeError` inside an
   * `@Method` rejects the promise it returned, where Stencil's `safeCall`
   * swallows one thrown from a lifecycle method.
   *
   * A cancelled animation rejects, which is still "done leaving".
   */
  private async waitForExit(): Promise<void> {
    if (typeof this.el.getAnimations !== 'function') return;

    const running = this.el
      .getAnimations()
      .filter((animation) => animation.playState !== 'finished');
    if (running.length === 0) return;

    await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  }

  render() {
    return (
      <Host>
        {/*
          The icon box always has something in it — the named icon stands in
          when nothing is slotted — so it needs no hiding. The action box does.
        */}
        <span class="icon" part="icon" aria-hidden="true">
          {!this.hasIcon && <pf-icon name={this.icon}></pf-icon>}
          <slot name="icon" onSlotchange={this.read} />
        </span>

        <div class="content" part="content">
          <p class="heading" part="heading">
            <slot />
          </p>
          <slot name="description" />
        </div>

        <div class={{ action: true, empty: !this.hasAction }} part="action">
          <slot name="action" onSlotchange={this.read} />
        </div>

        {this.dismissible && (
          <button
            type="button"
            class="dismiss"
            part="dismiss"
            aria-label={this.dismissLabel}
            onClick={() => void this.dismiss()}
          >
            <pf-icon name="circle-xmark" aria-hidden="true"></pf-icon>
          </button>
        )}
      </Host>
    );
  }
}
