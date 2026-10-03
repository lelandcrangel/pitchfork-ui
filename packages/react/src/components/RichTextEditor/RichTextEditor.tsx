import { RICH_TEXT_COMMANDS, stripOuterParagraph } from '@pitchfork-ui/core';
import {
  Fragment,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { composeDescribedBy } from '../../a11y';
import { useRovingTabIndex } from '../../hooks';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { cx } from '../../utils/cx';
import './RichTextEditor.css';

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

/*
 * Core's, which fixed a live defect: every one of the four conditions this
 * used to test is true of `<p>a</p><p>b</p>`, so two paragraphs were cut into
 * the broken fragment `a</p><p>b`.
 */
const normalizeHtml = (value: string | undefined) => stripOuterParagraph(value ?? '');
const getTextLength = (element: HTMLDivElement) => element.textContent?.length ?? 0;

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
    const countId = typeof characterMax === 'number' ? `${editorId}-count` : undefined;
    const describedBy = composeDescribedBy(ariaDescribedBy, descriptionId, errorId, countId);
    const editorRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const roving = useRovingTabIndex({ ref: toolbarRef });
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

    const handleCommand = (command: (typeof RICH_TEXT_COMMANDS)[number]['command']) => {
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
          {/*
            The buttons are core's list, so `<pf-rich-text-editor>` cannot
            offer a different set or different names for the same set.

            One tab stop with the arrows moving inside, which is the ARIA
            toolbar pattern and what the element's own toolbar does. Six
            focusable buttons meant tabbing past the field walked every one
            before reaching the text.
          */}
          <div
            ref={toolbarRef}
            className="pf-rte__toolbar"
            role="toolbar"
            aria-label="Formatting options"
            onFocus={roving.onFocus}
            onKeyDown={roving.onKeyDown}
          >
            {RICH_TEXT_COMMANDS.map((tool) => (
              <Fragment key={tool.command}>
                {tool.separatorBefore ? <span className="pf-rte__divider" aria-hidden /> : null}
                <button
                  type="button"
                  className="pf-rte__tool"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleCommand(tool.command)}
                  disabled={disabled}
                  aria-label={tool.label}
                >
                  {tool.text}
                </button>
              </Fragment>
            ))}
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
