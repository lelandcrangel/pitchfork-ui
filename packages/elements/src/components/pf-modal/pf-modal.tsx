import { getFocusableElements, lockPageScroll } from '@pitchfork-ui/core';

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
 * measured: focus cannot be taken by a light-DOM button, and a real Escape
 * fires `cancel` then `close`. So `trapFocus` from core is not needed here,
 * unlike in the React component.
 *
 * The one part of `showModal()` that cannot be relied on is where it puts
 * focus, and the gap is exactly the case every framework consumer is in. See
 * `showDialog` below.
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
   * Accessible name. Without it the dialog is named by its `pf-modal-header`:
   * by element reference where the browser has ARIA element reflection, which
   * can point out of a shadow root where an IDREF cannot, and by a copy of the
   * header's text where it does not. With neither, the dialog is unnamed --
   * better than the old fallback, which was every word in the modal run
   * together ("Delete project This cannot be undone. Cancel Delete") and which
   * went stale when the content changed.
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

  /**
   * Opens the dialog, and makes sure focus actually went into it.
   *
   * `showModal()` focuses the dialog or its first focusable descendant — but
   * **not** when light-DOM children were appended in the same task as the
   * open. Measured in Chromium with no framework involved: append the three
   * `pf-modal-*` sections to a long-mounted `pf-modal` and set `open` in the
   * same task, and the dialog opens with `document.activeElement` still on
   * `<body>` and `:focus-within` false. Leave one frame between the two and
   * focus lands inside; mount the element with its children and `open`
   * already set and focus lands inside. So it is the append racing the open,
   * and the flattened tree `showModal()`'s focusing steps read.
   *
   * That race is not an edge case: React, Angular and Vue all commit a
   * modal's content and its `open` in one go, so every framework consumer got
   * an open modal with focus outside it and nothing to say so — the page is
   * still inert, so the only symptom is that a reader is not taken to the
   * dialog and the first Tab is needed. Porting `apps/demo` is what found it.
   *
   * What the trace shows, with element identity and a `MutationObserver` on
   * the shadow root: `showModal()` **does** focus, onto `div[part=panel]`,
   * and one frame later a `focusout` with `relatedTarget: null` drops it,
   * with nothing removed from the shadow root. That is Chromium's focus
   * fixup running once the appended children are assigned to the slot and
   * finding the panel is no longer a valid target -- so it is not a render
   * that loses focus, and re-asserting after a render does not catch it
   * (measured: `componentDidRender` alone changes nothing here).
   *
   * So the dialog watches for exactly that: a `focusout` that goes nowhere
   * while the modal is open puts focus back. `requestAnimationFrame` after
   * `showModal()` covers the case where focus never arrived at all, and
   * `componentDidRender` covers a render that discards the focused node. All
   * three are the same guarded call, and the `:focus-within` guard makes it a
   * no-op whenever focus is already inside -- so none of them moves focus
   * that the platform or a consumer placed.
   */
  private showDialog() {
    const dialog = this.dialog;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    this.lockScroll();
    requestAnimationFrame(() => this.ensureFocusInside());
  }

  componentDidRender() {
    this.syncLabelledBy();
    this.ensureFocusInside();
  }

  /**
   * Focus left the dialog for nothing while it is open, which the platform
   * does when its focus fixup runs after the slotted content changes.
   *
   * `relatedTarget` is the test: a Tab or a click inside names where focus
   * went, and a modal dialog means it cannot have gone outside. The window
   * losing focus also reports null, hence the `document.hasFocus()` guard --
   * without it, switching tabs would pull focus back on return.
   */
  private onFocusOut = (event: FocusEvent) => {
    if (!this.open || event.relatedTarget) return;
    requestAnimationFrame(() => {
      if (document.hasFocus()) this.ensureFocusInside();
    });
  };

  /** Focus inside the open dialog, unless it is already there. */
  private ensureFocusInside() {
    const dialog = this.dialog;
    if (!this.open || !dialog?.isConnected || !dialog.open) return;
    if (dialog.matches(':focus-within')) return;
    const [first] = getFocusableElements(dialog);
    (first ?? dialog).focus();
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

  /** The slotted header, found by walking children (the mock DOM has no `:scope`). */
  private get header(): HTMLElement | null {
    for (const child of Array.from(this.el.children)) {
      if (child.tagName.toLowerCase() === 'pf-modal-header') return child as HTMLElement;
    }
    return null;
  }

  /** The copied-text fallback, used only where element reflection is missing. */
  private accessibleName() {
    if (this.label) return this.label;
    if (this.supportsElementReflection()) return undefined;
    const text = this.header?.textContent?.trim();
    return text || undefined;
  }

  private supportsElementReflection() {
    const dialog = this.dialog;
    return Boolean(dialog && 'ariaLabelledByElements' in dialog);
  }

  /** Points the dialog at its header by reference, which stays current by itself. */
  private syncLabelledBy() {
    const dialog = this.dialog as
      (HTMLDialogElement & { ariaLabelledByElements: Element[] | null }) | null;
    if (!dialog || !this.supportsElementReflection()) return;
    const header = this.label ? null : this.header;
    dialog.ariaLabelledByElements = header ? [header] : null;
  }

  render() {
    return (
      <Host>
        <dialog
          part="dialog"
          class="dialog"
          aria-label={this.accessibleName()}
          onCancel={this.onCancel}
          onFocusout={this.onFocusOut}
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
            {/* A header slotted in later still names the dialog. */}
            <slot onSlotchange={() => this.syncLabelledBy()} />
          </div>
        </dialog>
      </Host>
    );
  }
}
