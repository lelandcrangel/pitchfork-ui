import { useEffect, useRef } from 'react';

/**
 * A worked composition of custom elements, rendered from the markup it
 * documents.
 *
 * The React pattern stories kept two copies of themselves: a JSX `render` and
 * a `parameters.docs.source.code` string hand-written to match it. They had
 * already drifted — the login form's row lost its `flexWrap` and `gap` in the
 * copy a reader is shown, and nothing could have noticed, because no test
 * compares a story's output with the code beside it.
 *
 * Here the markup is one string, rendered with `innerHTML` and shown
 * verbatim, for the reasons `ElementPreview` sets it that way: the browser's
 * own parser is the path a consumer writing HTML takes, and one string cannot
 * disagree with itself.
 */
export interface Pattern {
  /** The composition. Rendered live, and shown in the "Show code" panel. */
  html: string;
  /**
   * The wiring, for a pattern that is not static.
   *
   * Three of these demonstrate behaviour rather than layout — a card whose
   * brand follows what you type, a table that sorts, a wizard that advances —
   * and markup alone cannot show that. The function's own source is what the
   * reader is shown, through `Function.prototype.toString()`, so the code
   * beside the demo is the code running it. That holds because `main.ts` sets
   * `minify: false`; with minification on it would still be correct, just
   * unpleasant.
   */
  setup?: (root: HTMLElement) => void;
}

export function PatternPreview({ pattern }: { pattern: Pattern }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.innerHTML = pattern.html;
    pattern.setup?.(root);
  }, [pattern]);

  return <div ref={rootRef} style={{ width: '100%' }} />;
}
