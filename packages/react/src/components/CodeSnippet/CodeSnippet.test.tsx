import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
