import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText, splitCodeLines } from './clipboard';

const withClipboard = (clipboard: unknown) => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  return () => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  };
};

let restore: (() => void) | undefined;

afterEach(() => {
  restore?.();
  restore = undefined;
});

describe('copyText', () => {
  it('copies and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    restore = withClipboard({ writeText });

    await expect(copyText('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  /*
   * The branch the React `CodeSnippet` got wrong: with no clipboard API its
   * `if` was simply false, nothing was copied, and the button said "Copied".
   */
  it('reports failure when there is no clipboard to write to', async () => {
    restore = withClipboard(undefined);
    await expect(copyText('hello')).resolves.toBe(false);
  });

  it('reports failure when the clipboard has no writeText', async () => {
    restore = withClipboard({});
    await expect(copyText('hello')).resolves.toBe(false);
  });

  it('reports failure when the write is refused', async () => {
    restore = withClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    await expect(copyText('hello')).resolves.toBe(false);
  });
});

describe('splitCodeLines', () => {
  it('splits on newlines', () => {
    expect(splitCodeLines('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  /* Nearly every file ends in one, and a numbered blank line is not code. */
  it('drops a single trailing newline', () => {
    expect(splitCodeLines('a\nb\n')).toEqual(['a', 'b']);
  });

  it('keeps the author’s own blank lines', () => {
    expect(splitCodeLines('a\n\nb')).toEqual(['a', '', 'b']);
    expect(splitCodeLines('a\n\n')).toEqual(['a', '']);
  });

  it('handles carriage returns', () => {
    expect(splitCodeLines('a\r\nb\r\n')).toEqual(['a', 'b']);
  });

  it('is one empty line for an empty snippet', () => {
    expect(splitCodeLines('')).toEqual(['']);
  });
});
