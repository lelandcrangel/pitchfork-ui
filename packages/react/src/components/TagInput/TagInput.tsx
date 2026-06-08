import { forwardRef, useId, useRef, useState } from 'react';
import { composeDescribedBy, Keys } from '../../a11y';
import { useComposedRefs, useControllableState } from '../../hooks';
import { cx } from '../../utils/cx';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { Tag, type TagVariant } from '../Tag';
import './TagInput.css';

export interface TagInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  label?: string;
  description?: string;
  error?: string;
  placeholder?: string;
  /** Maximum number of tags. Adding is blocked once reached. */
  max?: number;
  /** Allow the same tag more than once. Defaults to false (deduped, case-insensitive). */
  allowDuplicates?: boolean;
  /** Keys that commit the current draft as a tag. Defaults to Enter and comma. */
  delimiters?: string[];
  /** Reject a candidate tag (return false to block). Trimmed value is passed. */
  validate?: (tag: string) => boolean;
  /** Visual variant for the rendered tags. */
  tagVariant?: TagVariant;
  name?: string;
  required?: boolean;
}

export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(function TagInput(
  {
    id,
    value,
    defaultValue,
    onValueChange,
    label,
    description,
    error,
    placeholder = 'Add a tag…',
    max,
    allowDuplicates = false,
    delimiters = [Keys.Enter, ','],
    validate,
    tagVariant = 'neutral',
    name,
    required,
    disabled,
    className,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = composeDescribedBy(ariaDescribedBy, descriptionId, errorId);

  const [tags, setTags] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  });
  const currentTags = tags ?? [];

  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useComposedRefs(inputRef, ref);

  const atMax = max !== undefined && currentTags.length >= max;

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (atMax) return;
    if (validate && !validate(tag)) return;
    const exists = currentTags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (!allowDuplicates && exists) {
      setDraft('');
      return;
    }
    setTags([...currentTags, tag]);
    setDraft('');
  };

  const removeTag = (index: number) => {
    setTags(currentTags.filter((_, i) => i !== index));
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;

    if (delimiters.includes(event.key)) {
      // Don't commit on a bare comma keystroke producing an empty tag.
      if (draft.trim()) {
        event.preventDefault();
        addTag(draft);
      } else if (event.key !== Keys.Enter) {
        // swallow stray delimiter chars (e.g. comma) when there's nothing to add
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'Backspace' && draft === '' && currentTags.length > 0) {
      event.preventDefault();
      removeTag(currentTags.length - 1);
    }
  };

  // Support pasting a delimited list.
  const onPaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    const text = event.clipboardData.getData('text');
    if (!/[,\n\t]/.test(text)) return;
    event.preventDefault();
    text
      .split(/[,\n\t]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((t) => addTag(t));
  };

  return (
    <FieldWrapper
      labelFor={fieldId}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      required={required}
    >
      <div
        className={cx(
          'pf-taginput',
          error && 'pf-taginput--invalid',
          disabled && 'pf-taginput--disabled',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <ul className="pf-taginput__tags">
          {currentTags.map((tag, index) => (
            <li key={`${tag}-${index}`} className="pf-taginput__tag">
              <Tag variant={tagVariant} dismissible={!disabled} onDismiss={() => removeTag(index)}>
                {tag}
              </Tag>
            </li>
          ))}
          <li className="pf-taginput__field">
            <input
              {...props}
              id={fieldId}
              ref={inputRefs}
              type="text"
              className={cx('pf-taginput__input', className)}
              value={draft}
              placeholder={currentTags.length === 0 ? placeholder : ''}
              disabled={disabled || atMax}
              required={required && currentTags.length === 0}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onBlur={() => addTag(draft)}
            />
          </li>
        </ul>

        {name
          ? currentTags.map((tag, index) => (
              <input key={index} type="hidden" name={name} value={tag} />
            ))
          : null}
      </div>
    </FieldWrapper>
  );
});

TagInput.displayName = 'TagInput';
