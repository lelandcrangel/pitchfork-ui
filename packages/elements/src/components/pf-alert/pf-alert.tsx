import {
  animationsFinished,
  liveRegionRole,
  severityIconName,
  type LiveRegionVariant,
} from '@pitchfork-ui/core';
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

export type PfAlertVariant = LiveRegionVariant;

/**
 * An inline alert: an icon, a heading, a body and an optional dismiss button.
 *
 * The sibling of `pf-notification`, and deliberately a separate element
 * rather than a variant of it: an alert belongs in the page's flow and
 * collapses its own height when dismissed so the content below reflows, while
 * a notification is one of a stack in a corner and slides out. The two look
 * alike and behave differently, which is exactly when one element serving
 * both goes wrong.
 *
 * The role comes from core's `liveRegionRole`, so `warning` and `danger`
 * announce assertively and `info` and `success` wait their turn.
 *
 * @slot - the body, used instead of the `description` prop when present.
 * @slot icon - replaces the icon the variant would choose.
 * @part alert - the root box.
 * @part icon - the icon's box.
 * @part title - the heading.
 * @part body - the description's box.
 * @part dismiss - the dismiss button.
 */
@Component({
  tag: 'pf-alert',
  styleUrl: 'pf-alert.css',
  shadow: true,
})
export class PfAlert {
  @Element() el!: HTMLElement;

  /** Reflected, because the stylesheet selects on it for the colours. */
  @Prop({ reflect: true }) variant: PfAlertVariant = 'info';

  @Prop() heading?: string;

  /** The body. A slotted body is used instead when there is one. */
  @Prop() description?: string;

  /** Show the dismiss button. Reflected. */
  @Prop({ reflect: true }) dismissible = false;

  /** The dismiss button's accessible name. */
  @Prop() dismissLabel = 'Dismiss alert';

  /** Fires once the alert has finished leaving. */
  @Event() pfDismiss!: EventEmitter<void>;

  /** Reflected, because that is what the exit animation selects on. */
  @State() exiting = false;

  /** Whether anything was slotted into the default slot. */
  @State() hasSlottedBody = false;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.readBody();
  }

  /**
   * Dismisses the alert, waiting for its exit animation first.
   *
   * The wait is core's `animationsFinished`, which asks the element what is
   * actually running rather than sleeping for a duration someone wrote down:
   * under `prefers-reduced-motion` the stylesheet sets `animation: none`, no
   * test project applies `styleUrl` CSS at all, and a consumer may not have
   * loaded the stylesheet — in all three an `animationend` listener would
   * wait for ever and a timeout would be a fiction.
   */
  @Method()
  async dismiss() {
    if (this.exiting) return;
    this.exiting = true;

    await animationsFinished(this.el.shadowRoot?.querySelector('.alert'));
    this.pfDismiss.emit();
  }

  private readBody() {
    this.hasSlottedBody = Array.from(this.el.childNodes).some((node) =>
      node.nodeType === Node.ELEMENT_NODE
        ? !(node as Element).getAttribute('slot')
        : Boolean(node.textContent?.trim()),
    );
  }

  render() {
    const hasBody = this.hasSlottedBody || Boolean(this.description);

    return (
      <Host>
        <div
          class={{ alert: true, 'alert--exiting': this.exiting }}
          part="alert"
          role={liveRegionRole(this.variant)}
        >
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
            {/*
              The slot stays in the tree whether or not it holds anything: a
              slot that is not rendered never fires `slotchange`, so a body
              added later would stay invisible for good.
            */}
            <div class={{ body: true, empty: !hasBody }} part="body">
              <slot onSlotchange={() => this.readBody()}>{this.description}</slot>
            </div>
          </div>

          {this.dismissible && (
            <button
              type="button"
              class="dismiss"
              part="dismiss"
              aria-label={this.dismissLabel}
              onClick={() => this.dismiss()}
            >
              <pf-icon name="circle-xmark" aria-hidden="true"></pf-icon>
            </button>
          )}
        </div>
      </Host>
    );
  }
}
