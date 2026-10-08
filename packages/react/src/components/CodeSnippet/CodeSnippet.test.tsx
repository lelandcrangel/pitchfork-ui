import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeSnippet } from './CodeSnippet';

describe('CodeSnippet', () => {
  it('renders the code content', () => {
    const { container } = render(<CodeSnippet code="const x = 1;" />);
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')!.textContent).toContain('const x = 1');
  });

  it('renders the title when provided', () => {
    render(<CodeSnippet code="x" title="example.ts" />);
    expect(screen.getByText('example.ts')).toBeInTheDocument();
  });

  it('renders the language label when provided', () => {
    render(<CodeSnippet code="x" language="typescript" />);
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('renders a Copy button', () => {
    render(<CodeSnippet code="hello" title="file.ts" />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('calls onCodeCopy with the code when Copy is clicked', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const onCodeCopy = vi.fn();
    render(<CodeSnippet code="const y = 2;" title="file.ts" onCodeCopy={onCodeCopy} />);
    await user.click(screen.getByRole('button', { name: /copy/i }));
    expect(onCodeCopy).toHaveBeenCalledWith('const y = 2;');
    vi.unstubAllGlobals();
  });

  it('has an aria-live polite region for copy feedback', () => {
    const { container } = render(<CodeSnippet code="x" title="t" />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });
});

/*
 * The copy button's label is a claim about what just happened, so it has to
 * follow what the clipboard actually did. The write used to be guarded with
 * `if (navigator.clipboard?.writeText)` and `copied` set regardless, so in
 * any insecure context — every plain-`http` page — nothing was copied and the
 * button said "Copied". Core's `copyText` reports, and this reads the report.
 */
describe('CodeSnippet copying', () => {
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

  it('says it copied, and reports the code, once it has', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    restore = withClipboard({ writeText });
    const onCodeCopy = vi.fn();

    render(<CodeSnippet code="const a = 1;" onCodeCopy={onCodeCopy} />);
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(writeText).toHaveBeenCalledWith('const a = 1;');
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
    expect(onCodeCopy).toHaveBeenCalledWith('const a = 1;');
  });

  it('says the copy failed when there is no clipboard, and reports nothing', async () => {
    restore = withClipboard(undefined);
    const onCodeCopy = vi.fn();

    render(<CodeSnippet code="const a = 1;" onCodeCopy={onCodeCopy} />);
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(await screen.findByText('Copy failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^copy$/i })).toBeInTheDocument();
    expect(onCodeCopy).not.toHaveBeenCalled();
  });

  it('says the copy failed when the write is refused', async () => {
    restore = withClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });

    render(<CodeSnippet code="const a = 1;" />);
    await userEvent.click(screen.getByRole('button', { name: /copy/i }));

    expect(await screen.findByText('Copy failed')).toBeInTheDocument();
  });
});
