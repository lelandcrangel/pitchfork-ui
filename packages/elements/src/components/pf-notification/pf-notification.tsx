import { liveRegionRole, severityIconName, type LiveRegionVariant } from '@pitchfork-ui/core';

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

export type PfNotificationVariant = LiveRegionVariant;

/**
 * A notification: an icon, a heading, a body and an optional dismiss button.
 *
 * The role comes from core's `liveRegionRole`, so `warning` and `danger`
 * announce assertively and `info` and `success` wait their turn. The React
 * component used to be `role="status"` for all four — the rule lived in
 * `Alert` and nowhere else — which is why the mapping is now shared.
 *
 * @slot - the body, used instead of the `description` prop when present.
 * @slot icon - replaces the icon the variant would choose.
 * @slot action - buttons or links under the body.
 * @part notification - the root box.
 * @part icon - the icon's box.
 * @part title - the heading.
 * @part body - the description's box.
 * @part dismiss - the dismiss button.
 */
@Component({
  tag: 'pf-notification',
  styleUrl: 'pf-notification.css',
  shadow: true,
})
export class PfNotification {
  @Element() el!: HTMLElement;

  /** Severity. Reflected, because the stylesheet selects on it. */
  @Prop({ reflect: true }) variant: PfNotificationVariant = 'info';

  /** The bold first line. */
  @Prop() heading?: string;

  /** The body, when nothing is slotted. */
  @Prop() description?: string;

  /** Render the dismiss button. */
  @Prop({ reflect: true }) dismissable = false;

  /** Set while the exit animation plays. Reflected for the stylesheet. */
  @Prop({ mutable: true, reflect: true }) exiting = false;

  /**
   * Fires once the notification has finished leaving, which is the point at
   * which its owner should remove it from the DOM.
   */
  @Event() pfDismiss!: EventEmitter<void>;

  @State() hasSlottedBody = false;

  componentWillLoad() {
    this.readBody();
  }

  /**
   * Starts the exit animation and resolves when it has finished, having
   * emitted `pfDismiss`. Calling it twice is harmless.
   */
  @Method()
  async dismiss(): Promise<void> {
    if (this.exiting) return;
    this.exiting = true;
    await this.waitForExit();
    this.pfDismiss.emit();
  }

  /**
   * Waits for the exit animation, or returns straight away when there is not
   * one.
   *
   * `getAnimations()` is the only reliable way to ask: `animationName` from
   * `getComputedStyle` reports whatever `animation` declared whether or not
   * the keyframes resolve, and an `animationend` listener waits forever when
   * no animation ever started. Which is not hypothetical here — under
   * `prefers-reduced-motion` the stylesheet sets `animation: none`, and in
   * both Vitest projects no `styleUrl` CSS is applied at all, so nothing
   * animates and a listener-based dismiss would simply hang.
   */
  private async waitForExit(): Promise<void> {
    const root = this.el.shadowRoot?.querySelector('.notification');
    if (!root) return;

    // A frame, so the reflected `exiting` attribute has been applied and the
    // exit animation has actually been created.
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const running = root.getAnimations().filter((animation) => animation.playState !== 'finished');
    if (running.length === 0) return;

    // A cancelled animation rejects; that is still "done leaving".
    await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
  }

  private readBody() {
    this.hasSlottedBody = Array.from(this.el.childNodes).some((node) =>
      node.nodeType === Node.ELEMENT_NODE
        ? !(node as Element).getAttribute('slot')
        : Boolean(node.textContent?.trim()),
    );
  }

  render() {
    return (
      <Host>
        <div class="notification" part="notification" role={liveRegionRole(this.variant)}>
          <span class="icon" part="icon" aria-hidden="true">
            <slot name="icon">
              <pf-icon name={severityIconName(this.variant)}></pf-icon>
            </slot>
          </span>

          <div class="content">
            {this.heading && (
              <p class="title" part="title">
                {this.heading}
              </p>
            )}

            <div class="body" part="body" hidden={!this.hasSlottedBody && !this.description}>
              <slot onSlotchange={() => this.readBody()}>{this.description}</slot>
            </div>

            <slot name="action" />
          </div>

          {this.dismissable && (
            <button
              class="dismiss"
              part="dismiss"
              type="button"
              aria-label="Dismiss notification"
              onClick={() => this.dismiss()}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  fill="none"
                />
              </svg>
            </button>
          )}
        </div>
      </Host>
    );
  }
}
