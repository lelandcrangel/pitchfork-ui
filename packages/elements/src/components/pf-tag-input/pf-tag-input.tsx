import {
  addTag,
  composeDescribedBy,
  formatValueList,
  Keys,
  parseValueList,
  removeTagAt,
  splitPastedTags,
} from '@pitchfork-ui/core';

import { applyControlValidity } from '../../form-validity';
import type { PfTagVariant } from '../pf-tag/pf-tag';
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
  Watch,
} from '@stencil/core';

/**
 * A form-associated field that collects free-text tags.
 *
 * Unlike the other multi-value controls here the tags are not chosen from a
 * list, so there are no `pf-option` children — the chips are `pf-tag`
 * elements this component renders, and `pf-tag` already has the dismiss
 * button and the event for it.
 *
 * The rules are core's: trimming, the case-insensitive dedup (`React` and
 * `react` are one tag), the maximum, and `validate`. So is the paste split.
 * What stays here is what to do with the draft, which differs per refusal — a
 * duplicate clears it, because the tag asked for is already there, while
 * hitting the maximum leaves it so nothing is lost.
 *
 * Submits one entry per tag under one name, the same way `pf-multi-select`
 * does.
 *
 * @slot - nothing; the chips are rendered from `value`.
 * @part field - the wrapper around label, control and messages.
 * @part label - the label element.
 * @part control - the box holding the chips and the draft input.
 * @part tag - each chip.
 * @part input - the draft input.
 * @part description - the hint text below the control.
 * @part error - the error message below the control.
 */
@Component({
  tag: 'pf-tag-input',
  styleUrl: 'pf-tag-input.css',
  formAssociated: true,
  shadow: true,
})
export class PfTagInput {
  @Element() el!: HTMLElement;
  @AttachInternals() internals!: ElementInternals;

  /** Submitted under this name, once per tag. Reflected. */
  @Prop({ reflect: true }) name?: string;

  /** The tags, comma-separated. Reflected, so HTML can set it. */
  @Prop({ mutable: true, reflect: true }) value = '';

  @Prop() label?: string;

  @Prop() description?: string;

  @Prop() error?: string;

  @Prop() placeholder = 'Add a tag…';

  /** Stop accepting tags once there are this many. */
  @Prop() max?: number;

  /** Accept the same tag twice. The comparison is case-insensitive. */
  @Prop() allowDuplicates = false;

  /**
   * Visual variant for the chips, passed through to `pf-tag`.
   *
   * The type is imported from `pf-tag` rather than restated, so the two
   * cannot drift apart — a second copy of the union would compile happily
   * while offering a variant `pf-tag` has never heard of.
   */
  @Prop() tagVariant: PfTagVariant = 'neutral';

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /**
   * Refuse a candidate tag. A property rather than an attribute, because a
   * function cannot be written in HTML — the generated bindings set props as
   * properties, so a framework consumer passes it like any other.
   */
  @Prop() validate?: (tag: string) => boolean;

  /** Fires when the tags change, with both representations. */
  @Event() pfChange!: EventEmitter<{ value: string; values: string[] }>;

  private initialValue = '';

  componentWillLoad() {
    this.initialValue = this.value ?? '';
    this.syncFormState();
  }

  /** See pf-multi-select: the name is built into the FormData, so watch it. */
  @Watch('name')
  @Watch('value')
  @Watch('error')
  @Watch('required')
  syncFormState() {
    const tags = this.tags();

    if (tags.length === 0 || !this.name) {
      this.internals.setFormValue(null);
    } else {
      const data = new FormData();
      for (const tag of tags) data.append(this.name, tag);
      this.internals.setFormValue(data);
    }

    applyControlValidity(this.internals, tags.length > 0, this.required, this.error);
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

  formResetCallback() {
    this.value = this.initialValue;
    const field = this.input;
    if (field) field.value = '';
  }

  private tags(): string[] {
    return parseValueList(this.value);
  }

  private get input() {
    return this.el.shadowRoot?.querySelector<HTMLInputElement>('[part="input"]') ?? null;
  }

  private get options() {
    return { max: this.max, allowDuplicates: this.allowDuplicates, validate: this.validate };
  }

  private commit(tags: string[]) {
    this.value = formatValueList(tags);
    this.pfChange.emit({ value: this.value, values: tags });
  }

  /** Takes the draft as a tag, and decides what to do with the draft itself. */
  private addDraft(raw: string) {
    const result = addTag(this.tags(), raw, this.options);
    const field = this.input;

    if (result.added) {
      this.commit(result.tags);
      if (field) field.value = '';
      return;
    }

    // Only a duplicate consumes the draft; `max` leaves it so nothing is lost.
    if (result.refusal === 'duplicate' && field) field.value = '';
  }

  private remove(index: number) {
    if (this.disabled) return;
    this.commit(removeTagAt(this.tags(), index));
    this.input?.focus();
  }

  /**
   * Enter and comma commit; Backspace on an empty draft removes the last tag,
   * which is the gesture every tag field has.
   */
  private onKeyDown = (event: KeyboardEvent) => {
    if (this.disabled) return;
    const field = event.target as HTMLInputElement;

    if (event.key === Keys.Enter || event.key === ',') {
      // A bare comma with nothing typed is swallowed rather than committing an
      // empty tag; Enter is left alone so a form can still be submitted.
      if (field.value.trim()) {
        event.preventDefault();
        this.addDraft(field.value);
      } else if (event.key !== Keys.Enter) {
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Backspace' && field.value === '' && this.tags().length > 0) {
      event.preventDefault();
      this.remove(this.tags().length - 1);
    }
  };

  /**
   * A pasted list is folded, not added one at a time, so the maximum and the
   * dedup see each addition. The React component added them in a loop over
   * stale state and kept only the last — fixed there too, in the same change.
   */
  private onPaste = (event: ClipboardEvent) => {
    if (this.disabled) return;
    const pasted = splitPastedTags(event.clipboardData?.getData('text') ?? '');
    if (pasted.length === 0) return;

    event.preventDefault();
    let next = this.tags();
    for (const candidate of pasted) next = addTag(next, candidate, this.options).tags;

    this.commit(next);
    const field = this.input;
    if (field) field.value = '';
  };

  render() {
    const describedBy = composeDescribedBy(
      this.description && 'description',
      this.error && 'error',
    );
    const tags = this.tags();
    const atMax = this.max !== undefined && tags.length >= this.max;

    return (
      <Host>
        <div class="field" part="field">
          {this.label && (
            <label class="label" part="label" htmlFor="input">
              {this.label}
              {this.required && (
                <span class="required" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          <div class={{ control: true, 'control--invalid': Boolean(this.error) }} part="control">
            {tags.map((tag, index) => (
              <pf-tag
                key={tag}
                part="tag"
                variant={this.tagVariant}
                dismissible={!this.disabled}
                dismissLabel={`Remove ${tag}`}
                onPfDismiss={() => this.remove(index)}
              >
                {tag}
              </pf-tag>
            ))}

            <input
              id="input"
              part="input"
              class="input"
              type="text"
              autocomplete="off"
              disabled={this.disabled || atMax}
              required={this.required && tags.length === 0}
              placeholder={atMax ? '' : this.placeholder}
              aria-invalid={this.error ? 'true' : null}
              aria-describedby={describedBy}
              onKeyDown={this.onKeyDown}
              onPaste={this.onPaste}
              onBlur={(event) => {
                // Commit on blur, so a typed tag is not lost by clicking away.
                const field = event.target as HTMLInputElement;
                if (field.value.trim()) this.addDraft(field.value);
              }}
            />
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
        </div>
      </Host>
    );
  }
}
