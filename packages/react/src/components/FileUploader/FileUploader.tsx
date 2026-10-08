import {
  fileKey,
  fileLimitsHint,
  formatFileSize,
  mergeFileSelection,
  validateFileSelection,
} from '@pitchfork-ui/core';
import { forwardRef, useId, useMemo, useRef, useState } from 'react';
import { composeDescribedBy } from '../../a11y';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './FileUploader.css';

export interface FileUploaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'value' | 'defaultValue'
> {
  label?: string;
  description?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  required?: boolean;
  disabled?: boolean;
  value?: File[];
  defaultValue?: File[];
  onFilesChange?: (files: File[]) => void;
}

export const FileUploader = forwardRef<HTMLDivElement, FileUploaderProps>(function FileUploader(
  {
    id,
    className,
    label,
    description,
    error,
    accept,
    multiple = true,
    maxFiles,
    maxFileSize,
    required,
    disabled = false,
    value,
    defaultValue = [],
    onFilesChange,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const uploaderId = id ?? generatedId;
  const inputId = `${uploaderId}-input`;
  const descriptionId = description ? `${uploaderId}-description` : undefined;
  const errorId = error ? `${uploaderId}-error` : undefined;
  const internalErrorId = `${uploaderId}-internal-error`;

  const isControlled = value !== undefined;
  const [internalFiles, setInternalFiles] = useState<File[]>(defaultValue);
  const [dragActive, setDragActive] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>(undefined);
  const files = isControlled ? (value ?? []) : internalFiles;

  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * The internal error id only joins the list once there is an error to point
   * at. It was unconditional, so the dropzone described itself with an id
   * that resolved to nothing most of the time.
   */
  const describedBy = composeDescribedBy(
    ariaDescribedBy,
    descriptionId,
    errorId,
    internalError ? internalErrorId : undefined,
  );

  const setFiles = (nextFiles: File[]) => {
    if (!isControlled) {
      setInternalFiles(nextFiles);
    }

    onFilesChange?.(nextFiles);
  };

  const addFiles = (selected: FileList | null) => {
    if (!selected || disabled) {
      return;
    }

    /*
     * Merge, then validate — in that order and with no truncation between
     * them. The list used to be cut to `maxFiles` before being checked, which
     * made the "up to N files" message unreachable: the extra files were
     * simply gone, with nothing said. Core keeps the two steps apart.
     */
    const nextFiles = mergeFileSelection(files, Array.from(selected), { multiple });
    /*
     * `accept` is passed here as well as to the input, because the attribute
     * filters the *picker* and nothing else: a dropped file passes no filter
     * at all, so a dropzone that trusts the attribute accepts whatever is
     * dragged onto it.
     */
    const nextError = validateFileSelection(nextFiles, { maxFiles, maxFileSize, accept });

    /*
     * The input is cleared whichever way this goes. A file input fires no
     * `change` for an identical selection, so leaving the rejected value in
     * place meant picking the same file again did nothing at all — the error
     * stood with no way to retry it.
     */
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    if (nextError) {
      setInternalError(nextError);
      return;
    }

    setInternalError(undefined);
    setFiles(nextFiles);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, fileIndex) => fileIndex !== index);
    setInternalError(undefined);
    setFiles(next);
  };

  // Core's, so `<pf-file-uploader>` describes the same limits in the same words.
  const hintText = useMemo(
    () => fileLimitsHint(accept, { maxFiles, maxFileSize }),
    [accept, maxFileSize, maxFiles],
  );

  return (
    <FieldWrapper
      labelFor={inputId}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      required={required}
      footer={
        internalError ? (
          <p className="pf-field__error" id={internalErrorId}>
            {internalError}
          </p>
        ) : null
      }
    >
      <div ref={ref} {...props} id={uploaderId} className={cx('pf-file-uploader', className)}>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="pf-file-uploader__input"
          accept={accept}
          multiple={multiple}
          required={required}
          disabled={disabled}
          onChange={(event) => {
            addFiles(event.target.files);
          }}
        />

        {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- aria-invalid on the dropzone trigger is documented, tested behavior */}
        <button
          type="button"
          className={cx(
            'pf-file-uploader__dropzone',
            dragActive && 'pf-file-uploader__dropzone--active',
            (error || internalError) && 'pf-file-uploader__dropzone--invalid',
          )}
          onClick={() => {
            inputRef.current?.click();
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!disabled) {
              setDragActive(true);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addFiles(event.dataTransfer.files);
          }}
          disabled={disabled}
          aria-invalid={error || internalError ? true : undefined}
          aria-describedby={describedBy}
        >
          <span className="pf-file-uploader__icon" aria-hidden>
            <Icon name="file-arrow-up" />
          </span>
          <span className="pf-file-uploader__title">Upload files</span>
          <span className="pf-file-uploader__subtitle">
            Drag and drop files here, or click to browse.
          </span>
          {hintText ? <span className="pf-file-uploader__hint">{hintText}</span> : null}
        </button>

        {files.length > 0 ? (
          <ul className="pf-file-uploader__list" aria-label="Selected files">
            {files.map((file, index) => (
              <li key={fileKey(file)} className="pf-file-uploader__list-item">
                <span className="pf-file-uploader__file-meta">
                  <span className="pf-file-uploader__file-name">{file.name}</span>
                  <span className="pf-file-uploader__file-size">{formatFileSize(file.size)}</span>
                </span>
                <button
                  type="button"
                  className="pf-file-uploader__remove"
                  onClick={() => {
                    removeFile(index);
                  }}
                  aria-label={`Remove ${file.name}`}
                  disabled={disabled}
                >
                  <Icon name="circle-xmark" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FieldWrapper>
  );
});

FileUploader.displayName = 'FileUploader';
