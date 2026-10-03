/**
 * Copying text, and saying honestly whether it worked.
 *
 * In core because it is about the DOM — `navigator.clipboard` — rather than
 * about React, and because both layers have a copy button whose label is a
 * claim about what just happened.
 */

/**
 * Copies `text`, resolving to whether it was actually copied.
 *
 * The return value is the whole point. The React `CodeSnippet` wrote
 *
 * ```ts
 * if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(code);
 * setCopied(true);
 * ```
 *
 * — so where the API is missing the condition is simply false, nothing is
 * copied, and the button says "Copied" anyway. The API *is* missing in any
 * insecure context, which is every plain-`http` page and any iframe without
 * clipboard permission, so this was not a theoretical branch.
 *
 * There is deliberately no `document.execCommand('copy')` fallback. It is
 * deprecated, it needs a focused selection to work from, and it fails in most
 * of the same places; telling a person the copy failed, so they can select the
 * text themselves, is better than a second silent path to the same false
 * claim.
 */
export async function copyText(text: string): Promise<boolean> {
  const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
  if (!clipboard?.writeText) return false;

  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    // A denied permission, or a document that is not focused.
    return false;
  }
}

/**
 * A snippet's lines, for a gutter to count.
 *
 * A trailing newline is dropped, because a file that ends in one — nearly
 * every file — would otherwise show a numbered blank line at the end that is
 * not part of the code. Every other blank line is kept: they are the author's.
 */
export function splitCodeLines(code: string): string[] {
  const text = code.replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}
