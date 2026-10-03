import { addTag, removeTagAt, splitPastedTags } from '@pitchfork-ui/core';
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

  /*
   * The rules are core's — trimming, the case-insensitive dedup, the maximum
   * and `validate` — so `<pf-tag-input>` accepts and refuses the same tags.
   * What stays here is what to do with the draft, which differs per refusal:
   * a duplicate clears it, because the tag asked for is already there, while
   * hitting the maximum leaves it so nothing is lost.
   */
  const addDraftTag = (raw: string) => {
    const result = addTag(currentTags, raw, { max, allowDuplicates, validate });
    if (result.added) {
      setTags(result.tags);
      setDraft('');
      return;
    }
    if (result.refusal === 'duplicate') setDraft('');
  };

  const removeTag = (index: number) => {
    setTags(removeTagAt(currentTags, index));
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;

    if (delimiters.includes(event.key)) {
      // Don't commit on a bare comma keystroke producing an empty tag.
      if (draft.trim()) {
        event.preventDefault();
        addDraftTag(draft);
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

  // Support pasting a delimited list; the split is core's.
  const onPaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    const pasted = splitPastedTags(event.clipboardData.getData('text'));
    if (pasted.length === 0) return;
    event.preventDefault();

    // Folded rather than added one at a time, so the maximum and the dedup see
    // each addition — adding in a loop over stale state would not.
    let next = currentTags;
    for (const candidate of pasted) {
      const result = addTag(next, candidate, { max, allowDuplicates, validate });
      next = result.tags;
    }
    setTags(next);
    setDraft('');
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
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click forwards focus to the inner input; keyboard users tab to it directly */}
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
              onBlur={() => addDraftTag(draft)}
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
