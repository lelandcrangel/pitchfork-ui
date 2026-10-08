import { lockPageScroll } from '@pitchfork-ui/core';

import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Method,
  Prop,
  Watch,
} from '@stencil/core';

export type PfModalSize = 'sm' | 'md' | 'lg';

/**
 * A modal dialog.
 *
 * A native `<dialog>` opened with `showModal()`, which from inside a shadow
 * root gives the focus trap, Escape and the backdrop for nothing — all
 * measured: focus moves inside on open and cannot be taken by a light-DOM
 * button, and a real Escape fires `cancel` then `close`. So `trapFocus` from
 * core is not needed here, unlike in the React component.
 *
 * What `showModal()` does *not* do is lock page scroll — measured: a real
 * wheel still scrolled the page behind an open modal — so this element locks
 * it, exactly as the React component does.
 *
 * @slot - the modal's sections, usually `pf-modal-header`, `pf-modal-body` and
 * `pf-modal-footer`.
 * @part dialog - the native dialog, which is also the overlay.
 * @part panel - the bordered box the content sits in.
 * @part close - the close button.
 */
@Component({
  tag: 'pf-modal',
  styleUrl: 'pf-modal.css',
  shadow: true,
})
export class PfModal {
  @Element() el!: HTMLElement;

  /** Whether the modal is showing. Reflected so the stylesheet can select on it. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Panel width. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) size: PfModalSize = 'md';

  /**
   * Accessible name. Falls back to the text of whatever is slotted, which is
   * usually the header — `aria-labelledby` cannot be used, because an IDREF
   * does not cross a shadow boundary and the header is in the light DOM.
   */
  @Prop() label?: string;

  /** Close on Escape or a click on the overlay. Defaults to true. */
  @Prop() dismissable = true;

  /** Render the corner close button. Defaults to true. */
  @Prop() showCloseButton = true;

  /** Fires whenever the modal opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /**
   * Releases the page-scroll lock, or null when this modal does not hold it.
   * The lock is core's and reference-counted, so a slideout opening over a
   * modal cannot leave the page unscrollable.
   */
  private releaseScroll: (() => void) | null = null;

  componentDidLoad() {
    if (this.open) this.showDialog();
  }

  disconnectedCallback() {
    // A modal removed while open would otherwise leave the page unscrollable.
    this.unlockScroll();
  }

  /** Opens the modal. */
  @Method()
  async show(): Promise<void> {
    this.open = true;
  }

  /** Closes the modal. */
  @Method()
  async hide(): Promise<void> {
    this.open = false;
  }

  /**
   * The one place a state change is announced, whatever caused it: `show()`,
   * the close button, Escape, an overlay click, or a consumer writing the prop.
   *
   * The first version emitted from the `close` handler alone, which fired for
   * every close and for no open — caught by its own test. A consumer mirroring
   * this value back sets `open` to what it already is, which Stencil does not
   * treat as a change, so there is no loop.
   */
  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showDialog();
    else this.closeDialog();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  private get dialog() {
    return this.el.shadowRoot?.querySelector('dialog') ?? null;
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
  }

  private closeDialog() {
    const dialog = this.dialog;
    this.unlockScroll();
    if (dialog?.open) dialog.close();
  }

  /** Fires on Escape. Blocking it is how a non-dismissable modal stays put. */
  private onCancel = (event: Event) => {
    if (!this.dismissable) {
      event.preventDefault();
      return;
    }
    // Let it close; `close` does the state mirroring.
  };

  /**
   * Mirrors a close the browser made — Escape, or the dialog being closed by
   * anything other than this element — back into `open`, which then announces
   * it through the watch above.
   */
  private onClose = () => {
    this.unlockScroll();
    if (this.open) this.open = false;
  };

  /**
   * A click on the dialog element itself is a click on the overlay: the panel
   * is an inner box, so anything landing on the dialog missed the content.
   */
  private onDialogClick = (event: MouseEvent) => {
    if (!this.dismissable || event.target !== this.dialog) return;
    this.open = false;
  };

  private accessibleName() {
    if (this.label) return this.label;
    const text = this.el.textContent?.trim();
    return text ? text.slice(0, 120) : undefined;
  }

  render() {
    return (
      <Host>
        <dialog
          part="dialog"
          class="dialog"
          aria-label={this.accessibleName()}
          onCancel={this.onCancel}
          onClose={this.onClose}
          onClick={this.onDialogClick}
        >
          <div class="panel" part="panel">
            {this.showCloseButton && (
              <button
                class="close"
                part="close"
                type="button"
                aria-label="Close"
                onClick={() => this.hide()}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  aria-hidden="true"
                  focusable="false"
                >
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
            <slot />
          </div>
        </dialog>
      </Host>
    );
  }
}
