import { useEffect, useId, useState } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './CodeSnippet.css';

export interface CodeSnippetProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  code: string;
  language?: string;
  title?: React.ReactNode;
  showLineNumbers?: boolean;
  maxHeight?: number;
  copyLabel?: string;
  copiedLabel?: string;
  onCodeCopy?: (code: string) => void;
}

const splitLines = (value: string) => {
  if (!value.length) {
    return [''];
  }

  return value.replace(/\n$/, '').split('\n');
};

export function CodeSnippet({
  className,
  code,
  language,
  title,
  showLineNumbers = false,
  maxHeight,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
  onCodeCopy,
  ...props
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const liveRegionId = useId();
  const lines = splitLines(code);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copied]);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setCopyError(false);
      onCodeCopy?.(code);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  return (
    <figure className={cx('pf-code-snippet', className)} {...props}>
      {(title || language) && (
        <figcaption className="pf-code-snippet__header">
          <div className="pf-code-snippet__meta">
            {title ? <span className="pf-code-snippet__title">{title}</span> : null}
            {language ? <span className="pf-code-snippet__language">{language}</span> : null}
          </div>

          <button
            type="button"
            className="pf-code-snippet__copy"
            onClick={() => {
              void handleCopy();
            }}
            aria-describedby={liveRegionId}
          >
            <Icon name={copied ? 'circle-check' : 'copy'} aria-hidden />
            <span>{copied ? copiedLabel : copyLabel}</span>
          </button>
        </figcaption>
      )}

      {!(title || language) ? (
        <div className="pf-code-snippet__toolbar">
          <button
            type="button"
            className="pf-code-snippet__copy"
            onClick={() => {
              void handleCopy();
            }}
            aria-describedby={liveRegionId}
          >
            <Icon name={copied ? 'circle-check' : 'copy'} aria-hidden />
            <span>{copied ? copiedLabel : copyLabel}</span>
          </button>
        </div>
      ) : null}

      <pre
        className="pf-code-snippet__pre"
        style={maxHeight ? { maxHeight, overflow: 'auto' } : undefined}
      >
        <code>
          {showLineNumbers ? (
            <table className="pf-code-snippet__table" role="presentation">
              <tbody>
                {lines.map((line, index) => (
                  <tr key={`${index}-${line}`}>
                    <td className="pf-code-snippet__line-number" aria-hidden>
                      {index + 1}
                    </td>
                    <td className="pf-code-snippet__line-content">{line || ' '}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            code
          )}
        </code>
      </pre>

      <span id={liveRegionId} className="pf-code-snippet__sr-only" aria-live="polite">
        {copyError ? 'Copy failed' : copied ? copiedLabel : ''}
      </span>
    </figure>
  );
}
