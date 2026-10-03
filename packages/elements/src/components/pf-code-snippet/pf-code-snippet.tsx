import { copyText, splitCodeLines } from '@pitchfork-ui/core';
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

/**
 * A code block with a copy button.
 *
 * **No syntax highlighting, deliberately.** The React `CodeSnippet` uses
 * `prism-react-renderer`, which is a React renderer and has no equivalent
 * here; the alternatives are all large runtime dependencies, and an element in
 * a design system should not make a consumer's bundle choose one. A consumer
 * who already highlights code slots the markup their highlighter produced into
 * the default slot, and this renders that instead of the plain text — it still
 * owns the frame, the header, the copy button and the announcement.
 *
 * Line numbers are offered only for the plain-text path. Aligning a gutter
 * with someone else's markup needs to know where their lines break, which only
 * they know.
 *
 * @slot - pre-highlighted markup, rendered instead of `code`.
 * @part figure - the frame.
 * @part header - the title, language and copy button.
 * @part title - the title text.
 * @part language - the language tag.
 * @part copy - the copy button.
 * @part pre - the code block.
 * @part line - one numbered line, when line numbers are on.
 * @part line-number - that line's number.
 */
@Component({
  tag: 'pf-code-snippet',
  styleUrl: 'pf-code-snippet.css',
  shadow: true,
})
export class PfCodeSnippet {
  @Element() el!: HTMLElement;

  /** The code, as plain text. */
  @Prop() code = '';

  /** Shown as a tag in the header, and not used for anything else. */
  @Prop({ reflect: true }) language?: string;

  /** Shown in the header. */
  @Prop() heading?: string;

  @Prop({ reflect: true }) showLineNumbers = false;

  /** Scrolls past this height, in pixels. */
  @Prop() maxHeight?: number;

  @Prop() copyLabel = 'Copy';

  @Prop() copiedLabel = 'Copied';

  @Prop() copyFailedLabel = 'Copy failed';

  /**
   * How long the button keeps saying what the last press did, in
   * milliseconds.
   *
   * A prop rather than a constant because a live region that still holds
   * "Copied" when the next copy happens announces nothing, so how long it
   * holds is a real decision — and because a test cannot use fake timers
   * here: `vi.useFakeTimers()` replaces `requestAnimationFrame`, which
   * Stencil's render queue runs on, and wedges every test after it.
   */
  @Prop() feedbackDuration = 1600;

  /** Fires with the text that reached the clipboard. Not fired on a failure. */
  @Event() pfCopy!: EventEmitter<{ code: string }>;

  /** Fires when the copy could not be made, with the reason shown. */
  @Event() pfCopyError!: EventEmitter<{ message: string }>;

  @State() copied = false;

  @State() failed = false;

  /** Whether the consumer slotted their own highlighted markup. */
  @State() hasMarkup = false;

  private resetTimer?: number;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.readSlot();
  }

  disconnectedCallback() {
    if (this.resetTimer !== undefined) window.clearTimeout(this.resetTimer);
  }

  /** Copies the snippet, as pressing the button does. */
  @Method()
  async copy(): Promise<boolean> {
    /*
     * The return value is the whole point. The React component guarded the
     * write with `if (navigator.clipboard?.writeText)` and then said
     * "Copied" regardless, so in any insecure context it claimed a copy it
     * had not made.
     */
    const ok = await copyText(this.text);

    this.copied = ok;
    this.failed = !ok;

    if (ok) this.pfCopy.emit({ code: this.text });
    else this.pfCopyError.emit({ message: this.copyFailedLabel });

    // One timer, restarted rather than stacked.
    if (this.resetTimer !== undefined) window.clearTimeout(this.resetTimer);
    this.resetTimer = window.setTimeout(
      () => {
        this.copied = false;
        this.failed = false;
        this.resetTimer = undefined;
      },
      Number(this.feedbackDuration) || 1600,
    );

    return ok;
  }

  /** What gets copied: the code, or the slotted markup's own text. */
  private get text(): string {
    if (this.code) return this.code;
    return this.el.textContent?.replace(/^\n/, '').trimEnd() ?? '';
  }

  private readSlot() {
    this.hasMarkup = Array.from(this.el.children).some(
      (child) => !child.getAttribute('slot') && child.textContent?.trim(),
    );
  }

  render() {
    const lines = splitCodeLines(this.code);
    const numbered = this.showLineNumbers && !this.hasMarkup;
    const label = this.failed
      ? this.copyFailedLabel
      : this.copied
        ? this.copiedLabel
        : this.copyLabel;

    return (
      <Host>
        <figure class="figure" part="figure">
          <figcaption class="header" part="header">
            <span class="meta">
              {this.heading && (
                <span class="title" part="title">
                  {this.heading}
                </span>
              )}
              {this.language && (
                <span class="language" part="language">
                  {this.language}
                </span>
              )}
            </span>

            <button
              type="button"
              class="copy"
              part="copy"
              aria-describedby="status"
              onClick={() => this.copy()}
            >
              <pf-icon
                name={this.failed ? 'triangle-exclamation' : this.copied ? 'circle-check' : 'copy'}
                aria-hidden="true"
              ></pf-icon>
              <span>{label}</span>
            </button>
          </figcaption>

          <pre
            class="pre"
            part="pre"
            style={this.maxHeight ? { maxHeight: `${this.maxHeight}px`, overflow: 'auto' } : {}}
          >
            {/*
              The slot stays in the tree whichever path is taken: a slot that
              is not rendered never fires `slotchange`, so markup added later
              would stay invisible for good.
            */}
            <code class={{ markup: true, empty: !this.hasMarkup }}>
              <slot onSlotchange={() => this.readSlot()} />
            </code>

            {!this.hasMarkup &&
              (numbered ? (
                <code class="numbered">
                  {lines.map((line, index) => (
                    <span class="line" part="line">
                      <span class="line-number" part="line-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span class="line-content">{line === '' ? '\n' : line}</span>
                    </span>
                  ))}
                </code>
              ) : (
                <code class="plain">{this.code}</code>
              ))}
          </pre>

          {/*
            The announcement, on a box that is always present: a live region
            added at the moment it changes is not announced. It is also the
            button's description, which is what tells a reader using the
            button what the last press did.
          */}
          <span class="sr-only" id="status" aria-live="polite">
            {this.failed ? this.copyFailedLabel : this.copied ? this.copiedLabel : ''}
          </span>
        </figure>
      </Host>
    );
  }
}
