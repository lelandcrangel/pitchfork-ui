import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { composeDescribedBy } from '../../a11y';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { cx } from '../../utils/cx';
import './RichTextEditor.css';

type ToolbarCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'removeFormat';

export interface RichTextEditorProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  label?: string;
  description?: string;
  error?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  characterMax?: number;
  required?: boolean;
  disabled?: boolean;
}

// Strips a single outer <p>...</p> wrapper if present
const stripOuterPTags = (html: string): string => {
  if (!html) return '';
  const trimmed = html.trim();
  if (
    trimmed.startsWith('<p>') &&
    trimmed.endsWith('</p>') &&
    trimmed.indexOf('<p>') === 0 &&
    trimmed.lastIndexOf('</p>') === trimmed.length - 4
  ) {
    // Remove only the outermost <p>...</p>
    return trimmed.slice(3, -4);
  }
  return html;
};

const normalizeHtml = (value: string | undefined) =>
  stripOuterPTags(value ?? '');
const getTextLength = (element: HTMLDivElement) =>
  element.textContent?.length ?? 0;

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      id,
      label,
      description,
      error,
      value,
      defaultValue,
      onChange,
      placeholder = 'Start typing...',
      minHeight = 140,
      characterMax,
      required = false,
      disabled = false,
      className,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const editorId = id ?? generatedId;
    const descriptionId = description ? `${editorId}-description` : undefined;
    const errorId = error ? `${editorId}-error` : undefined;
    const countId =
      typeof characterMax === 'number' ? `${editorId}-count` : undefined;
    const describedBy = composeDescribedBy(
      ariaDescribedBy,
      descriptionId,
      errorId,
      countId,
    );
    const editorRef = useRef<HTMLDivElement>(null);
    const lastValidHtmlRef = useRef('');
    const [characterCount, setCharacterCount] = useState(0);
    const isControlled = value !== undefined;

    useImperativeHandle(ref, () => editorRef.current as HTMLDivElement, []);

    useEffect(() => {
      if (!editorRef.current) {
        return;
      }

      const nextValue = normalizeHtml(isControlled ? value : defaultValue);
      if (editorRef.current.innerHTML !== nextValue) {
        editorRef.current.innerHTML = nextValue;
      }

      lastValidHtmlRef.current = nextValue;
      setCharacterCount(getTextLength(editorRef.current));
    }, [defaultValue, isControlled, value]);

    const emitChange = () => {
      if (!editorRef.current) {
        return;
      }

      onChange?.(editorRef.current.innerHTML);
    };

    const enforceLimitAndEmit = () => {
      if (!editorRef.current) {
        return;
      }

      const nextLength = getTextLength(editorRef.current);
      if (typeof characterMax === 'number' && nextLength > characterMax) {
        editorRef.current.innerHTML = lastValidHtmlRef.current;
        setCharacterCount(getTextLength(editorRef.current));
        return;
      }

      lastValidHtmlRef.current = editorRef.current.innerHTML;
      setCharacterCount(nextLength);
      emitChange();
    };

    const handleCommand = (command: ToolbarCommand) => {
      if (!editorRef.current || disabled) {
        return;
      }

      editorRef.current.focus();
      document.execCommand(command);
      enforceLimitAndEmit();
    };

    return (
      <FieldWrapper
        labelFor={editorId}
        label={label}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        required={required}
      >

        <div
          className={cx(
            'pf-rte',
            error && 'pf-rte--invalid',
            disabled && 'pf-rte--disabled',
            className,
          )}
        >
          <div
            className="pf-rte__toolbar"
            role="toolbar"
            aria-label="Formatting options"
          >
            <button
              type="button"
              className="pf-rte__tool"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleCommand('bold')}
              disabled={disabled}
              aria-label="Bold"
            >
              B
            </button>
            <button
              type="button"
              className="pf-rte__tool"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleCommand('italic')}
              disabled={disabled}
              aria-label="Italic"
            >
              I
            </button>
            <button
              type="button"
              className="pf-rte__tool"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleCommand('underline')}
              disabled={disabled}
              aria-label="Underline"
            >
              U
            </button>
            <span className="pf-rte__divider" aria-hidden />
            <button
              type="button"
              className="pf-rte__tool"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleCommand('insertUnorderedList')}
              disabled={disabled}
              aria-label="Bulleted list"
            >
              • List
            </button>
            <button
              type="button"
              className="pf-rte__tool"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleCommand('insertOrderedList')}
              disabled={disabled}
              aria-label="Numbered list"
            >
              1. List
            </button>
            <button
              type="button"
              className="pf-rte__tool"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleCommand('removeFormat')}
              disabled={disabled}
              aria-label="Clear formatting"
            >
              Clear
            </button>
          </div>

          <div
            id={editorId}
            ref={editorRef}
            className="pf-rte__editor"
            contentEditable={!disabled}
            role="textbox"
            aria-multiline="true"
            aria-labelledby={label ? `${editorId}-label` : undefined}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            aria-disabled={disabled ? true : undefined}
            data-placeholder={placeholder}
            suppressContentEditableWarning
            onInput={enforceLimitAndEmit}
            style={{ '--pf-rte-min-height': `${minHeight}px` } as React.CSSProperties}
            {...props}
          />
        </div>

        {typeof characterMax === 'number' ? (
          <p className="pf-rte__count" id={countId} aria-live="polite">
            {characterCount}/{characterMax}
          </p>
        ) : null}

      </FieldWrapper>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';
