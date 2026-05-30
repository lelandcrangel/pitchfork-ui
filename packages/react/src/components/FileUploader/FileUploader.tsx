import { useId, useMemo, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './FileUploader.css';

const bytesToSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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

export function FileUploader({
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
}: FileUploaderProps) {
  const generatedId = useId();
  const uploaderId = id ?? generatedId;
  const inputId = `${uploaderId}-input`;
  const descriptionId = description ? `${uploaderId}-description` : undefined;
  const errorId = error ? `${uploaderId}-error` : undefined;
  const internalErrorId = `${uploaderId}-internal-error`;
  const describedBy =
    [ariaDescribedBy, descriptionId, errorId, internalErrorId]
      .filter(Boolean)
      .join(' ') || undefined;

  const isControlled = value !== undefined;
  const [internalFiles, setInternalFiles] = useState<File[]>(defaultValue);
  const [dragActive, setDragActive] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>(
    undefined,
  );
  const files = isControlled ? (value ?? []) : internalFiles;

  const inputRef = useRef<HTMLInputElement>(null);

  const setFiles = (nextFiles: File[]) => {
    if (!isControlled) {
      setInternalFiles(nextFiles);
    }

    onFilesChange?.(nextFiles);
  };

  const validateFiles = (incoming: File[]) => {
    if (maxFileSize) {
      const oversized = incoming.find((file) => file.size > maxFileSize);

      if (oversized) {
        return `"${oversized.name}" exceeds the ${bytesToSize(maxFileSize)} size limit.`;
      }
    }

    if (maxFiles && incoming.length > maxFiles) {
      return `You can upload up to ${maxFiles} file${maxFiles === 1 ? '' : 's'}.`;
    }

    return undefined;
  };

  const addFiles = (selected: FileList | null) => {
    if (!selected || disabled) {
      return;
    }

    const incoming = Array.from(selected);
    const merged = multiple ? [...files, ...incoming] : incoming.slice(0, 1);
    const deduped = Array.from(
      new Map(
        merged.map((file) => [
          `${file.name}-${file.size}-${file.lastModified}`,
          file,
        ]),
      ).values(),
    );

    const nextFiles = maxFiles ? deduped.slice(0, maxFiles) : deduped;
    const nextError = validateFiles(nextFiles);

    if (nextError) {
      setInternalError(nextError);
      return;
    }

    setInternalError(undefined);
    setFiles(nextFiles);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, fileIndex) => fileIndex !== index);
    setInternalError(undefined);
    setFiles(next);
  };

  const hintText = useMemo(() => {
    const parts: string[] = [];

    if (accept) {
      parts.push(`Accepted: ${accept}`);
    }

    if (maxFileSize) {
      parts.push(`Max size: ${bytesToSize(maxFileSize)}`);
    }

    if (maxFiles) {
      parts.push(`Max files: ${maxFiles}`);
    }

    return parts.join(' | ');
  }, [accept, maxFileSize, maxFiles]);

  return (
    <div className="pf-field">
      {label ? (
        <label className="pf-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="pf-field__required" aria-hidden="true">*</span>}
        </label>
      ) : null}

      <div
        {...props}
        id={uploaderId}
        className={cx('pf-file-uploader', className)}
      >
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
          {hintText ? (
            <span className="pf-file-uploader__hint">{hintText}</span>
          ) : null}
        </button>

        {files.length > 0 ? (
          <ul className="pf-file-uploader__list" aria-label="Selected files">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="pf-file-uploader__list-item"
              >
                <span className="pf-file-uploader__file-meta">
                  <span className="pf-file-uploader__file-name">
                    {file.name}
                  </span>
                  <span className="pf-file-uploader__file-size">
                    {bytesToSize(file.size)}
                  </span>
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

      {description ? (
        <p className="pf-field__description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="pf-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
      {internalError ? (
        <p className="pf-field__error" id={internalErrorId}>
          {internalError}
        </p>
      ) : null}
    </div>
  );
}
