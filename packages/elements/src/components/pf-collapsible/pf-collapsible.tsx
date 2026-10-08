import { Keys } from '@pitchfork-ui/core';
import {
  Component,
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
 * One disclosure: a header that shows and hides the content below it.
 *
 * The same panel mechanics as `pf-accordion-item` — a `0fr` → `1fr` grid row
 * so the height animates to the content's own, and `inert` on the closed panel
 * because that height still holds focusable content — but no group above it,
 * so this element owns `open` itself.
 *
 * Both IDREFs stay inside this one shadow root, which is where an IDREF
 * resolves: the header names the panel with `aria-controls` and the panel
 * names the header back with `aria-labelledby`.
 *
 * @slot trigger - the header's label.
 * @slot - the content.
 * @part trigger - the header button.
 * @part label - the label's box inside the header.
 * @part icon - the chevron.
 * @part panel - the animating box around the content.
 * @part content - the region holding the content.
 */
@Component({
  tag: 'pf-collapsible',
  styleUrl: 'pf-collapsible.css',
  shadow: true,
})
export class PfCollapsible {
  /** Whether the content is showing. Reflected so the stylesheet selects on it. */
  @Prop({ mutable: true, reflect: true }) open = false;

  /** Reflected, so the stylesheet can mark the header. */
  @Prop({ reflect: true }) disabled = false;

  /** Show the rotating chevron. Defaults to true. */
  @Prop() showChevron = true;

  /** Fires whenever the content opens or closes, whoever caused it. */
  @Event() pfOpenChange!: EventEmitter<{ open: boolean }>;

  /** Opens the content. */
  @Method()
  async show(): Promise<void> {
    if (!this.disabled) this.open = true;
  }

  /** Closes the content. */
  @Method()
  async hide(): Promise<void> {
    this.open = false;
  }

  /**
   * The one place the change is announced, whatever caused it: the header, a
   * method, or a consumer writing the prop. Announcing it from the click
   * handler instead would miss the other two — the same mistake `pf-popover`
   * and `pf-modal` both made from their DOM-event handlers.
   *
   * A consumer mirroring the value back sets `open` to what it already is,
   * which Stencil does not treat as a change, so there is no loop.
   */
  @Watch('open')
  handleOpenChange(next: boolean, previous: boolean) {
    if (next !== previous) this.pfOpenChange.emit({ open: next });
  }

  private onClick = () => {
    if (this.disabled) return;
    this.open = !this.open;
  };

  /**
   * Escape closes it from the header, which is what the React component does.
   * Only from the header: Escape inside the content belongs to whatever is in
   * there — a dialog, or a field clearing itself.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.key !== Keys.Escape || !this.open) return;
    if (event.composedPath()[0] !== this.trigger) return;

    event.preventDefault();
    this.open = false;
  }

  private trigger?: HTMLButtonElement;

  render() {
    return (
      <Host>
        <button
          type="button"
          id="trigger"
          class="trigger"
          part="trigger"
          ref={(el) => (this.trigger = el)}
          disabled={this.disabled}
          aria-expanded={this.open ? 'true' : 'false'}
          aria-controls="panel"
          onClick={this.onClick}
        >
          <span class="label" part="label">
            <slot name="trigger" />
          </span>
          {this.showChevron && (
            <span class="icon" part="icon" aria-hidden="true">
              <pf-icon name="chevron-down"></pf-icon>
            </span>
          )}
        </button>

        <div class="panel" part="panel">
          {/*
            `inert` as well as the collapsed height: a panel animating to zero
            still holds focusable content, so without it the next Tab from the
            header lands inside the box that just closed.
          */}
          <div
            class="content"
            part="content"
            id="panel"
            role="region"
            aria-labelledby="trigger"
            inert={!this.open}
          >
            <div class="inner" part="inner">
              <slot />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
