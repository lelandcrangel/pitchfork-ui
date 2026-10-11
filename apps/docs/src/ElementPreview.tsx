import { useEffect, useRef, type CSSProperties } from 'react';

/**
 * One live custom element, rendered beside the markup that produced it.
 *
 * The markup is set with `innerHTML` rather than written as JSX, and that is
 * the point rather than a shortcut. These pages document `<pf-*>` elements for
 * a consumer writing plain HTML, and the browser's own parser is the thing
 * that consumer uses: a custom element upgrades whenever its definition lands,
 * so the preview is correct no matter when the lazy loader finishes. Writing
 * the same markup as JSX would instead go through React's custom-element
 * handling, which decides between an attribute and a property per value — a
 * second set of rules, documented nowhere on these pages, sitting between the
 * reader and what they will actually type.
 *
 * It also means the preview and the code block cannot disagree, because they
 * are one string.
 *
 * The markup is static, hand-written and in this repository — the examples
 * module is the only caller, nothing here comes from a URL, a story arg or a
 * consumer. It is still `innerHTML`, so it is worth saying out loud rather
 * than leaving a reviewer to work out where the content came from.
 */
export interface ElementExample {
  /** The markup. Rendered live, and shown verbatim underneath. */
  html: string;
  /**
   * One instance for the `Interactive` story, where Storybook's controls drive
   * the first `<tag>` in it.
   *
   * Optional, and `html` is used when it is absent — which is right for the
   * 65 examples that are already a single instance, and avoids 65 copies that
   * could drift from the thing they copy. `--strict` requires it wherever the
   * example shows the element more than once: controls that drive the first of
   * six buttons while five sit unchanged are worse than no controls.
   *
   * It is also where `pf-modal` and `pf-command-palette` are `open`. Both are
   * a native `<dialog>` opened with `showModal()`, so an open one fills the
   * viewport — which is wrong inside a docs page and exactly right in a story,
   * where the canvas is the whole iframe.
   */
  interactive?: string;
  /**
   * Anything HTML cannot express, given the preview's root.
   *
   * Eight props across the library are typed as an array or a function and so
   * get no attribute from Stencil at all — `pf-kbd.keys`,
   * `pf-video-player.sources`, the `isDateDisabled` predicates. Writing those
   * in markup parses, renders, and never delivers the value, which is exactly
   * what `validate_usage` reports as an error. A preview that needs one has to
   * assign the property, the same as a consumer would.
   */
  setup?: (root: HTMLElement) => void;
}

const frame: CSSProperties = {
  border: '1px solid var(--color-semantic-border-default)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-semantic-background-default)',
};

const stage: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--space-3)',
  padding: 'var(--space-5)',
};

const source: CSSProperties = {
  borderTop: '1px solid var(--color-semantic-border-muted)',
  color: 'var(--color-semantic-text-subtle)',
  fontFamily: 'var(--pf-code-font-family)',
  fontSize: '0.8125rem',
  lineHeight: 1.6,
  margin: 0,
  overflowX: 'auto',
  padding: 'var(--space-4) var(--space-5)',
  whiteSpace: 'pre-wrap',
};

export function ElementPreview({ example }: { example: ElementExample }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = stageRef.current;
    if (!root) return;
    // Assigning replaces, so a second run under StrictMode cannot stack a
    // duplicate copy of the example on top of the first.
    root.innerHTML = example.html;
    example.setup?.(root);
  }, [example]);

  return (
    <div style={frame}>
      <div ref={stageRef} style={stage} />
      <pre style={source}>{example.html}</pre>
    </div>
  );
}
