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
  State,
  Watch,
} from '@stencil/core';

export type PfSlideoutMenuPlacement = 'left' | 'right';
export type PfSlideoutMenuSize = 'sm' | 'md' | 'lg';

/**
 * A panel that slides in from the edge of the screen — a modal dialog that
 * happens to be anchored to a side rather than centred.
 *
 * Which is why this is a native `<dialog>` opened with `showModal()`, exactly
 * as `pf-modal` is. The React component hand-rolls the whole modal contract:
 * a focus trap over `getFocusableElements`, a `focusin` listener to pull focus
 * back, Escape handling, an overlay element, and focus restoration on close —
 * about ninety lines. `showModal()` gives all of it, and the element needs
 * none of core's `trapFocus`.
 *
 * The one thing it does not give is a page-scroll lock, so that comes from
 * core's reference-counted `lockPageScroll`.
 *
 * @slot - the panel's body.
 * @slot footer - actions pinned below the body.
 * @part dialog - the native dialog, which is also the overlay.
 * @part panel - the sliding panel.
 * @part header - the header row, present only when there is a heading.
 * @part title - the heading.
 * @part description - the supporting line under the heading.
 * @part body - the scrolling region the default slot renders into.
 * @part footer - the footer region.
 * @part close - the close button.
 */
@Component({
  tag: 'pf-slideout-menu',
  styleUrl: 'pf-slideout-menu.css',
  shadow: true,
})
export class PfSlideoutMenu {
  @Element() el!: HTMLElement;

  /** Whether the panel is showing. Reflected so the stylesheet can select on it. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Which edge it slides in from. Reflected; the stylesheet positions on it. */
  @Prop({ reflect: true }) placement: PfSlideoutMenuPlacement = 'right';

  /** Panel width. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) size: PfSlideoutMenuSize = 'md';

  /** The heading shown in the header. */
  @Prop() heading?: string;

  /** A supporting line under the heading. */
  @Prop() description?: string;

  /**
   * Accessible name, for when there is no `heading` to name it.
   *
   * With a heading, `aria-labelledby` is used instead and points at the
   * heading's id. That works here and not in `pf-modal` because this heading
   * is a prop rendered into this element's own shadow root, so the IDREF never
   * crosses a boundary — `pf-modal`'s header is slotted light DOM, which is
   * why it has to fall back to copying text into `aria-label`.
   */
  @Prop() label?: string;

  /** Close on Escape or a click on the overlay. Defaults to true. */
  @Prop() dismissable = true;

  /** Render the corner close button. Defaults to true. */
  @Prop() showCloseButton = true;

  /** Fires whenever the panel opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /**
   * Whether anything is slotted into the footer.
   *
   * Asked in JS rather than selected in CSS because a wrapper holding a
   * `<slot>` cannot be collapsed by a `:not(:has(*))` rule — the slot element
   * is itself a child, so the rule never matches, measured. An empty footer
   * carries a border and padding, so it has to actually not render.
   */
  @State() hasFooter = false;

  private releaseScroll: (() => void) | null = null;

  /*
   * Read on the way in as well as on `slotchange`, so the first paint is
   * right: the mock DOM never fires `slotchange`, and nor does the browser
   * before the first assignment.
   */
  componentWillLoad() {
    this.readFooter();
  }

  componentDidLoad() {
    if (this.open) this.showDialog();
  }

  disconnectedCallback() {
    // Removed while open, the page would otherwise stay unscrollable.
    this.unlockScroll();
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
   * The one place a state change is announced, whatever caused it. Emitting
   * from the `close` handler instead fires for the browser-driven path and for
   * none of the user-driven ones, because by then the element has already
   * moved its own `open` and the guard sees no change.
   */
  @Watch('open')
  syncOpen(next: boolean, previous: boolean) {
    if (next) this.showDialog();
    else this.closeDialog();
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  /**
   * Counts element children rather than `assignedNodes`, because this runs in
   * `componentWillLoad` too, before there is a shadow root to ask.
   */
  private readFooter() {
    this.hasFooter = Array.from(this.el.children).some(
      (child) => child.getAttribute('slot') === 'footer',
    );
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

  /** Fires on Escape. Blocking it is how a non-dismissable panel stays put. */
  private onCancel = (event: Event) => {
    if (!this.dismissable) event.preventDefault();
  };

  /** Mirrors a browser-driven close back into `open`, which announces it. */
  private onClose = () => {
    this.unlockScroll();
    if (this.open) this.open = false;
  };

  /**
   * A click on the dialog itself is a click on the overlay: the panel is an
   * inner box, so anything landing on the dialog missed the content.
   */
  private onDialogClick = (event: MouseEvent) => {
    if (!this.dismissable || event.target !== this.dialog) return;
    this.open = false;
  };

  render() {
    const hasHeader = Boolean(this.heading || this.description || this.showCloseButton);

    return (
      <Host>
        <dialog
          part="dialog"
          class="dialog"
          aria-label={this.heading ? undefined : this.label}
          aria-labelledby={this.heading ? 'title' : undefined}
          aria-describedby={this.description ? 'description' : undefined}
          onCancel={this.onCancel}
          onClose={this.onClose}
          onClick={this.onDialogClick}
        >
          <div class="panel" part="panel">
            {hasHeader && (
              <header class="header" part="header">
                <div class="headings">
                  {this.heading && (
                    <h2 class="title" part="title" id="title">
                      {this.heading}
                    </h2>
                  )}
                  {this.description && (
                    <p class="description" part="description" id="description">
                      {this.description}
                    </p>
                  )}
                </div>

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
              </header>
            )}

            <div class="body" part="body">
              <slot />
            </div>

            {/*
              Always rendered, hidden when empty rather than omitted: a slot
              that is not in the tree never fires `slotchange`, so omitting it
              would make a footer added later stay invisible for good.
            */}
            <footer class="footer" part="footer" hidden={!this.hasFooter}>
              <slot name="footer" onSlotchange={() => this.readFooter()} />
            </footer>
          </div>
        </dialog>
      </Host>
    );
  }
}
