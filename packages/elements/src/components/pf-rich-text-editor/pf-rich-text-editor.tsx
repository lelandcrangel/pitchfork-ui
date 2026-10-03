import {
  RICH_TEXT_COMMANDS,
  composeDescribedBy,
  getRovingItems,
  resolveListMove,
  resolveRovingKey,
  stripOuterParagraph,
  syncRovingTabIndex,
} from '@pitchfork-ui/core';
import {
  AttachInternals,
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
import { applyControlValidity } from '../../form-validity';

/**
 * A form-associated rich-text field over a `contenteditable`.
 *
 * The toolbar is core's list, so this and the React `RichTextEditor` cannot
 * offer different buttons, and the value is normalised with core's
 * `stripOuterParagraph`, so they cannot disagree about what a round trip
 * looks like.
 *
 * Two things differ from the React component, both deliberate:
 *
 * - **The toolbar is one tab stop**, with the arrows moving inside it, which
 *   is the ARIA toolbar pattern and what `pf-toolbar` already does. The React
 *   version is six tab stops inside a `role="toolbar"`, so tabbing past the
 *   field walks every button; `todo.md` has that.
 * - **It is a real form control.** `formAssociated` with `ElementInternals` is
 *   what puts the value in `FormData`; a `contenteditable` is not a form
 *   control in any framework, and the React component's value reaches a form
 *   only if the consumer wires it there themselves.
 *
 * `document.execCommand` is deprecated and is still the only way to apply
 * formatting inside a `contenteditable` without a dependency, which is the
 * same trade the React component makes.
 *
 * @part field - the wrapper around label, toolbar, editor and messages.
 * @part label - the label element.
 * @part toolbar - the formatting toolbar.
 * @part tool - one toolbar button.
 * @part editor - the editable area.
 * @part count - the character counter.
 * @part description - the hint text.
 * @part error - the error message.
 */
@Component({
  tag: 'pf-rich-text-editor',
  styleUrl: 'pf-rich-text-editor.css',
  formAssociated: true,
  shadow: true,
})
export class PfRichTextEditor {
  @AttachInternals() internals!: ElementInternals;

  @Element() el!: HTMLElement;

  /**
   * Submitted under this name.
   *
   * Reflected, because a form-associated custom element takes its submission
   * name from the `name` content attribute rather than from this property.
   */
  @Prop({ reflect: true }) name?: string;

  /** The field's value, as HTML. */
  @Prop({ mutable: true }) value = '';

  @Prop() label?: string;

  @Prop() description?: string;

  /** Error message from the consumer. Its presence marks the control invalid. */
  @Prop() error?: string;

  @Prop() placeholder = 'Start typing...';

  /** The editable area's smallest height, in pixels. */
  @Prop() minHeight = 140;

  /** The most characters of text the field will hold. */
  @Prop() characterMax?: number;

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Fires when the value changes, however it changed. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /** The text length, which the counter shows. */
  @State() characterCount = 0;

  /** The value a reset restores, captured before `value` can be replaced. */
  private initialValue = '';

  /** The last value inside the character limit, which an overrun reverts to. */
  private lastWithinLimit = '';

  private editor?: HTMLElement;

  private toolbar?: HTMLElement;

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    this.syncFormState();
  }

  componentDidLoad() {
    this.writeValueIntoEditor();
    if (this.toolbar) syncRovingTabIndex(getRovingItems(this.toolbar));
  }

  @Watch('value')
  handleValueChange() {
    this.writeValueIntoEditor();
    this.syncFormState();
  }

  @Watch('error')
  @Watch('required')
  syncFormState() {
    const text = this.editor?.textContent ?? '';
    this.internals.setFormValue(this.value ?? '');
    applyControlValidity(this.internals, text.trim().length > 0, this.required, this.error);
  }

  @Method()
  async checkValidity(): Promise<boolean> {
    return this.internals.checkValidity();
  }

  @Method()
  async reportValidity(): Promise<boolean> {
    return this.internals.reportValidity();
  }

  @Method()
  async getValidationMessage(): Promise<string> {
    return this.internals.validationMessage;
  }

  /** Applies one of the toolbar's commands, as pressing its button does. */
  @Method()
  async format(command: string) {
    this.runCommand(command);
  }

  /**
   * A reset restores the value the control started with, not an empty string —
   * the rule a native `<input value="initial">` follows.
   */
  formResetCallback() {
    this.value = this.initialValue;
    this.writeValueIntoEditor();
  }

  /**
   * The editable area's content is written imperatively, never rendered.
   *
   * A `contenteditable` that a vdom also owns is a fight: the person types,
   * the DOM changes under the renderer, and the next render puts the old
   * content back with the caret at the start. So the element renders an empty
   * box once and sets `innerHTML` only when the value it holds and the value
   * in the box actually differ.
   */
  private writeValueIntoEditor() {
    const next = stripOuterParagraph(this.value ?? '');
    if (this.editor && this.editor.innerHTML !== next) this.editor.innerHTML = next;

    this.lastWithinLimit = next;
    this.characterCount = this.editor?.textContent?.length ?? 0;
  }

  private onInput = () => {
    if (!this.editor) return;

    const length = this.editor.textContent?.length ?? 0;

    /*
     * Over the limit: put the last good value back rather than let the
     * content grow. The caret lands at the start of the box, which is the
     * cost of this approach and the reason a limit should be generous.
     */
    if (typeof this.characterMax === 'number' && length > this.characterMax) {
      this.editor.innerHTML = this.lastWithinLimit;
      this.characterCount = this.editor.textContent?.length ?? 0;
      return;
    }

    this.lastWithinLimit = this.editor.innerHTML;
    this.characterCount = length;
    this.value = this.editor.innerHTML;
    this.syncFormState();
    this.pfChange.emit({ value: this.value });
  };

  private runCommand(command: string) {
    if (!this.editor || this.disabled) return;

    this.editor.focus();
    /*
     * Deprecated, and still the only way to format inside a
     * `contenteditable` without a dependency. It is also the one DOM call
     * here that a test project cannot make: Stencil's mock DOM has no
     * `execCommand` at all, so the toolbar is browser-tested.
     */
    document.execCommand?.(command);
    this.onInput();
  }

  /** The toolbar is one tab stop, with the arrows moving inside it. */
  private onToolbarKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || !this.toolbar) return;

    const action = resolveRovingKey(event.key, 'horizontal');
    if (!action) return;

    const items = getRovingItems(this.toolbar);
    const current = items.indexOf(this.el.shadowRoot?.activeElement as HTMLElement);
    if (current === -1) return;

    const next = resolveListMove(
      action,
      items.map((_, index) => index),
      current,
    );
    if (next >= 0) {
      event.preventDefault();
      items[next].focus();
    }
  };

  private onToolbarFocusIn = (event: FocusEvent) => {
    if (this.toolbar) syncRovingTabIndex(getRovingItems(this.toolbar), event.target as HTMLElement);
  };

  render() {
    const hasCount = typeof this.characterMax === 'number';
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
      hasCount && 'count',
    );

    return (
      <Host>
        <div class="field" part="field">
          {this.label && (
            <label class="label" part="label" id="label" htmlFor="editor">
              {this.label}
              {this.required && (
                <span class="required" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          <div
            class={{
              box: true,
              'box--invalid': Boolean(this.error),
              'box--disabled': this.disabled,
            }}
          >
            <div
              class="toolbar"
              part="toolbar"
              role="toolbar"
              aria-label="Formatting options"
              aria-orientation="horizontal"
              ref={(node) => (this.toolbar = node)}
              onKeyDown={this.onToolbarKeyDown}
              onFocusin={this.onToolbarFocusIn}
            >
              {RICH_TEXT_COMMANDS.map((tool) => [
                tool.separatorBefore ? <span class="divider" aria-hidden="true"></span> : null,
                <button
                  type="button"
                  class="tool"
                  part="tool"
                  data-command={tool.command}
                  aria-label={tool.label}
                  disabled={this.disabled}
                  // A press must not take the caret out of the editor, or the
                  // command has no selection to apply to.
                  onMouseDown={(event: MouseEvent) => event.preventDefault()}
                  onClick={() => this.runCommand(tool.command)}
                >
                  {tool.text}
                </button>,
              ])}
            </div>

            {/*
              Rendered empty, once. Its content is set imperatively, because a
              vdom that also owned it would put the old content back under the
              person's caret on the next render.
            */}
            <div
              id="editor"
              class="editor"
              part="editor"
              role="textbox"
              aria-multiline="true"
              aria-labelledby={this.label ? 'label' : null}
              aria-required={this.required ? 'true' : null}
              aria-invalid={this.error ? 'true' : null}
              aria-describedby={describedBy}
              aria-disabled={this.disabled ? 'true' : null}
              contentEditable={!this.disabled}
              data-placeholder={this.placeholder}
              style={{ '--pf-rte-min-height': `${this.minHeight}px` }}
              ref={(node) => (this.editor = node)}
              onInput={this.onInput}
            ></div>
          </div>

          {this.description && (
            <p class="description" part="description" id="description">
              {this.description}
            </p>
          )}

          {this.error && (
            <p class="error" part="error" id="error">
              {this.error}
            </p>
          )}

          {hasCount && (
            <p class="count" part="count" id="count" aria-live="polite">
              {this.characterCount}/{this.characterMax}
            </p>
          )}
        </div>
      </Host>
    );
  }
}
