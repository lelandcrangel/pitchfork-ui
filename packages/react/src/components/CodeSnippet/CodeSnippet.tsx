import { useEffect, useId, useState } from 'react';
import { Highlight, Language, themes } from 'prism-react-renderer';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './CodeSnippet.css';

export interface CodeSnippetProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> {
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
            {title ? (
              <span className="pf-code-snippet__title">{title}</span>
            ) : null}
            {language ? (
              <span className="pf-code-snippet__language">{language}</span>
            ) : null}
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

      <Highlight
        code={code}
        language={(language as Language) || 'tsx'}
        theme={themes.vsDark}
      >
        {({
          className: prismClass,
          style,
          tokens,
          getLineProps,
          getTokenProps,
        }) => (
          <pre
            className={cx('pf-code-snippet__pre', prismClass)}
            style={{
              ...style,
              ...(maxHeight ? { maxHeight, overflow: 'auto' } : undefined),
            }}
          >
            <code>
              {showLineNumbers ? (
                <table className="pf-code-snippet__table" role="presentation">
                  <tbody>
                    {tokens.map((line, i) => (
                      <tr key={i}>
                        <td
                          className="pf-code-snippet__line-number"
                          aria-hidden
                        >
                          {i + 1}
                        </td>
                        <td className="pf-code-snippet__line-content">
                          {line.map((token, key) => {
                            const tokenProps = getTokenProps({ token });
                            return <span key={key} {...tokenProps} />;
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                tokens.map((line, i) => {
                  const lineProps = getLineProps({ line });
                  return (
                    <div key={i} {...lineProps}>
                      {line.map((token, key) => {
                        const tokenProps = getTokenProps({ token });
                        return <span key={key} {...tokenProps} />;
                      })}
                    </div>
                  );
                })
              )}
            </code>
          </pre>
        )}
      </Highlight>

      <span
        id={liveRegionId}
        className="pf-code-snippet__sr-only"
        aria-live="polite"
      >
        {copyError ? 'Copy failed' : copied ? copiedLabel : ''}
      </span>
    </figure>
  );
}
