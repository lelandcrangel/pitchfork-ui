/**
 * The two decisions a rich-text field makes outside of the contenteditable
 * itself: which commands its toolbar offers, and what its value looks like
 * when it is handed back.
 */

/** A command both toolbars offer, in the order they offer it. */
export interface RichTextCommand {
  /** The `document.execCommand` name. */
  command:
    'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'removeFormat';
  /** The accessible name. */
  label: string;
  /** The button's visible text. */
  text: string;
  /** True where a separator is drawn before this button. */
  separatorBefore?: boolean;
}

/**
 * The toolbar, as data.
 *
 * Shared so the two layers cannot offer different buttons, or the same
 * buttons under different names — a design system whose editor is `B I U` in
 * one framework and `B I U S` in another is two editors.
 */
export const RICH_TEXT_COMMANDS: readonly RichTextCommand[] = [
  { command: 'bold', label: 'Bold', text: 'B' },
  { command: 'italic', label: 'Italic', text: 'I' },
  { command: 'underline', label: 'Underline', text: 'U' },
  { command: 'insertUnorderedList', label: 'Bulleted list', text: '• List', separatorBefore: true },
  { command: 'insertOrderedList', label: 'Numbered list', text: '1. List' },
  { command: 'removeFormat', label: 'Clear formatting', text: 'Clear' },
];

/**
 * Drops a single wrapping `<p>` from a value, leaving everything else alone.
 *
 * A contenteditable browsers have been left to themselves wraps a first line
 * in `<p>` in some engines and not others, so a value round-tripped through
 * one and set into another gains a level of nesting each time. Stripping one
 * outer paragraph is what keeps `value` stable.
 *
 * The check that matters is that the first `</p>` **is** the last one. The
 * React `RichTextEditor` tested `startsWith('<p>')`, `endsWith('</p>')`,
 * `indexOf('<p>') === 0` and `lastIndexOf('</p>') === length - 4`, every one
 * of which is true of `<p>a</p><p>b</p>` — two paragraphs, which it then cut
 * into the broken fragment `a</p><p>b`. Measured against that exact input.
 */
export function stripOuterParagraph(html: string): string {
  if (!html) return '';

  const trimmed = html.trim();
  if (!trimmed.startsWith('<p>') || !trimmed.endsWith('</p>')) return html;
  // One paragraph only: the first closing tag has to be the last.
  if (trimmed.indexOf('</p>') !== trimmed.length - 4) return html;

  return trimmed.slice(3, -4);
}
