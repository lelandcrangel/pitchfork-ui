import {
  composeDescribedBy,
  fileKey,
  fileLimitsHint,
  formatFileSize,
  mergeFileSelection,
  validateFileSelection,
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
 * A form-associated file picker with a dropzone.
 *
 * All of the rules are core's — how a size is written, what makes two
 * selections the same file, which files a selection leaves you with, what is
 * wrong with the result and how the limits are described — so this and the
 * React `FileUploader` cannot drift on any of them.
 *
 * It deliberately has **no Angular `ControlValueAccessor`**. The generator
 * offers accessors that write `value`, a number or `checked`, and this
 * control's value is a `File[]`: a text accessor would store `[object File]`.
 * An Angular consumer binds `[files]` and `(pfChange)`, and the submission
 * still works, because that goes through `ElementInternals` rather than
 * through the accessor.
 *
 * @part field - the wrapper around label, dropzone and messages.
 * @part label - the label element.
 * @part dropzone - the button that opens the picker and takes the drop.
 * @part icon - the dropzone's icon.
 * @part list - the list of chosen files.
 * @part file - one row of that list.
 * @part remove - a row's remove button.
 * @part description - the hint text.
 * @part error - the error message.
 */
@Component({
  tag: 'pf-file-uploader',
  styleUrl: 'pf-file-uploader.css',
  formAssociated: true,
  shadow: true,
})
export class PfFileUploader {
  @AttachInternals() internals!: ElementInternals;

  @Element() el!: HTMLElement;

  /**
   * Submitted under this name.
   *
   * Reflected, because a form-associated custom element takes its submission
   * name from the `name` content attribute rather than from this property.
   */
  @Prop({ reflect: true }) name?: string;

  /**
   * The files chosen. A property only — there is no attribute that could
   * carry a `File`.
   */
  @Prop({ mutable: true }) files: File[] = [];

  /** The `accept` list, in the form an `<input type="file">` takes. */
  @Prop() accept?: string;

  @Prop({ reflect: true }) multiple = true;

  /** The most files that may be held at once. */
  @Prop() maxFiles?: number;

  /** The largest any one file may be, in bytes. */
  @Prop() maxFileSize?: number;

  @Prop() label?: string;

  @Prop() description?: string;

  /** Error message from the consumer. Its presence marks the control invalid. */
  @Prop() error?: string;

  @Prop({ reflect: true }) required = false;

  @Prop({ reflect: true }) disabled = false;

  /** Fires when the files held change, however they changed. */
  @Event() pfChange!: EventEmitter<{ files: File[] }>;

  /** Fires when a selection is refused, with the reason shown to the person. */
  @Event() pfReject!: EventEmitter<{ message: string }>;

  /** The uploader's own complaint about the last selection. */
  @State() rejection?: string;

  /**
   * How deep the drag is.
   *
   * A counter rather than a boolean: `dragenter` and `dragleave` both bubble
   * from the dropzone's own children, so moving the pointer from the icon to
   * the title fires a leave and then an enter and a boolean flickers off. The
   * React `FileUploader` has that flicker.
   */
  @State() dragDepth = 0;

  /** What a form reset restores, captured before `files` can be replaced. */
  private initialFiles: File[] = [];

  private input?: HTMLInputElement;

  componentWillLoad() {
    this.initialFiles = [...(this.files ?? [])];
    this.syncFormState();
  }

  @Watch('files')
  @Watch('error')
  @Watch('required')
  // The uploader's own complaint is a real constraint failure, not only a
  // message, so the validity has to follow it as well as the consumer's.
  @Watch('rejection')
  syncFormState() {
    const held = this.files ?? [];

    /*
     * A `FormData` rather than a string, because one control here submits one
     * entry per file — which is how a native multi-file input submits, and
     * the only shape a server handling the form can use. `setFormValue`
     * ignores the element's own `name` attribute when handed a `FormData`, so
     * the key has to be built into it.
     */
    if (this.name && held.length > 0) {
      const data = new FormData();
      for (const file of held) data.append(this.name, file);
      this.internals.setFormValue(data);
    } else {
      // `null`, not an empty string: a file input with nothing chosen is
      // absent from the submission entirely.
      this.internals.setFormValue(null);
    }

    applyControlValidity(
      this.internals,
      held.length > 0,
      this.required,
      this.error ?? this.rejection,
    );
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

  /** Opens the file picker, as clicking the dropzone does. */
  @Method()
  async open() {
    if (!this.disabled) this.input?.click();
  }

  /**
   * A reset restores the files the control started with, not an empty list —
   * the rule a native `<input value="initial">` follows.
   */
  formResetCallback() {
    this.files = [...this.initialFiles];
    this.rejection = undefined;
    this.dragDepth = 0;
  }

  private get limits() {
    return { maxFiles: this.maxFiles, maxFileSize: this.maxFileSize, accept: this.accept };
  }

  private addFiles(selected: FileList | null) {
    if (!selected || this.disabled) return;

    const next = mergeFileSelection(this.files ?? [], Array.from(selected), {
      multiple: this.multiple,
    });

    /*
     * `accept` is checked here as well as set on the input, because the
     * attribute filters the *picker* and nothing else: a dropped file passes
     * no filter at all.
     */
    const rejection = validateFileSelection(next, this.limits);

    /*
     * The input is cleared whichever way this goes. A file input fires no
     * `change` for an identical selection, so a rejected value left in place
     * means picking the same file again does nothing and the message stands
     * with no way to retry.
     */
    if (this.input) this.input.value = '';

    if (rejection) {
      this.rejection = rejection;
      this.pfReject.emit({ message: rejection });
      return;
    }

    this.rejection = undefined;
    this.files = next;
    this.pfChange.emit({ files: next });
  }

  private removeAt(index: number) {
    if (this.disabled) return;
    const next = (this.files ?? []).filter((_, position) => position !== index);
    this.rejection = undefined;
    this.files = next;
    this.pfChange.emit({ files: next });
  }

  private onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    if (this.disabled) return;
    this.dragDepth += 1;
  };

  private onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    this.dragDepth = Math.max(0, this.dragDepth - 1);
  };

  private onDrop = (event: DragEvent) => {
    event.preventDefault();
    this.dragDepth = 0;
    this.addFiles(event.dataTransfer?.files ?? null);
  };

  render() {
    const held = this.files ?? [];
    const message = this.error ?? this.rejection;
    const hint = fileLimitsHint(this.accept, this.limits);
    const describedBy = composeDescribedBy(
      this.description && 'description',
      message && 'error',
      hint && 'hint',
    );

    return (
      <Host>
        <div class="field" part="field">
          {this.label && (
            <label class="label" part="label" htmlFor="dropzone">
              {this.label}
              {this.required && (
                <span class="required" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}

          {/*
            The input is in this shadow root, so it reaches no surrounding
            form of its own — and is given no `name` for that reason. The
            submission comes from `setFormValue` above.
          */}
          <input
            ref={(node) => (this.input = node)}
            id="input"
            class="input"
            type="file"
            accept={this.accept}
            multiple={this.multiple}
            disabled={this.disabled}
            tabindex={-1}
            aria-hidden="true"
            onChange={(event) => this.addFiles((event.target as HTMLInputElement).files)}
          />

          <button
            id="dropzone"
            type="button"
            class={{
              dropzone: true,
              'dropzone--active': this.dragDepth > 0,
              'dropzone--invalid': Boolean(message),
            }}
            part="dropzone"
            disabled={this.disabled}
            aria-invalid={message ? 'true' : null}
            aria-describedby={describedBy}
            onClick={() => this.open()}
            onDragEnter={this.onDragEnter}
            onDragOver={(event: DragEvent) => event.preventDefault()}
            onDragLeave={this.onDragLeave}
            onDrop={this.onDrop}
          >
            <span class="icon" part="icon" aria-hidden="true">
              <pf-icon name="file-arrow-up"></pf-icon>
            </span>
            <span class="title">Upload files</span>
            <span class="subtitle">Drag and drop files here, or click to browse.</span>
            {hint && (
              <span class="hint" id="hint">
                {hint}
              </span>
            )}
          </button>

          {held.length > 0 && (
            <ul class="list" part="list" aria-label="Selected files">
              {held.map((file, index) => (
                <li class="file" part="file" key={fileKey(file)}>
                  <span class="meta">
                    <span class="file-name">{file.name}</span>
                    <span class="file-size">{formatFileSize(file.size)}</span>
                  </span>
                  <button
                    type="button"
                    class="remove"
                    part="remove"
                    aria-label={`Remove ${file.name}`}
                    disabled={this.disabled}
                    onClick={() => this.removeAt(index)}
                  >
                    <pf-icon name="circle-xmark" aria-hidden="true"></pf-icon>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {this.description && (
            <p class="description" part="description" id="description">
              {this.description}
            </p>
          )}

          {message && (
            <p class="error" part="error" id="error">
              {message}
            </p>
          )}
        </div>
      </Host>
    );
  }
}
