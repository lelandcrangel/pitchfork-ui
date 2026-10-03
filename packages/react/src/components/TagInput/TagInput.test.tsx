import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagInput } from './TagInput';

const getInput = (name = /tags/i) => screen.getByRole('textbox', { name });

describe('TagInput', () => {
  it('renders a labelled text input', () => {
    render(<TagInput label="Tags" />);
    expect(getInput()).toBeInTheDocument();
  });

  it('renders existing tags from defaultValue', () => {
    render(<TagInput label="Tags" defaultValue={['react', 'ui']} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('ui')).toBeInTheDocument();
  });

  it('adds a tag on Enter and clears the draft', () => {
    const onValueChange = vi.fn();
    render(<TagInput label="Tags" onValueChange={onValueChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'design' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).toHaveBeenLastCalledWith(['design']);
    expect(input).toHaveValue('');
  });

  it('adds a tag on comma', () => {
    const onValueChange = vi.fn();
    render(<TagInput label="Tags" onValueChange={onValueChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'tokens' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onValueChange).toHaveBeenLastCalledWith(['tokens']);
  });

  it('dedupes case-insensitively by default', () => {
    const onValueChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['React']} onValueChange={onValueChange} />);
    const input = getInput();
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('removes the last tag on Backspace when the draft is empty', () => {
    const onValueChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['a', 'b']} onValueChange={onValueChange} />);
    const input = getInput();
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onValueChange).toHaveBeenLastCalledWith(['a']);
  });

  it('removes a tag via its dismiss button', () => {
    const onValueChange = vi.fn();
    render(<TagInput label="Tags" defaultValue={['one', 'two']} onValueChange={onValueChange} />);
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    expect(onValueChange).toHaveBeenLastCalledWith(['two']);
  });

  it('blocks adding past max', () => {
    const onValueChange = vi.fn();
    render(
      <TagInput label="Tags" max={2} defaultValue={['a', 'b']} onValueChange={onValueChange} />,
    );
    const input = getInput();
    expect(input).toBeDisabled();
  });

  it('rejects tags failing validate', () => {
    const onValueChange = vi.fn();
    render(
      <TagInput label="Emails" validate={(t) => t.includes('@')} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole('textbox', { name: /emails/i });
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  /*
   * Pasting a list used to add only the last tag: the handler called its add
   * helper once per candidate, and each call built the next list from the same
   * closed-over state, so the final `setTags` won. It folds the additions now,
   * which also lets the maximum and the dedup see each one.
   */
  it('adds every tag from a pasted list', () => {
    const onValueChange = vi.fn();
    render(<TagInput onValueChange={onValueChange} />);

    fireEvent.paste(screen.getByRole('textbox'), {
      clipboardData: { getData: () => 'alpha, beta, gamma' },
    });

    expect(onValueChange).toHaveBeenCalledWith(['alpha', 'beta', 'gamma']);
  });

  it('applies the maximum across a pasted list', () => {
    const onValueChange = vi.fn();
    render(<TagInput max={2} onValueChange={onValueChange} />);

    fireEvent.paste(screen.getByRole('textbox'), {
      clipboardData: { getData: () => 'alpha, beta, gamma' },
    });

    expect(onValueChange).toHaveBeenCalledWith(['alpha', 'beta']);
  });

  it('dedupes within a pasted list', () => {
    const onValueChange = vi.fn();
    render(<TagInput onValueChange={onValueChange} />);

    fireEvent.paste(screen.getByRole('textbox'), {
      clipboardData: { getData: () => 'alpha, Alpha, beta' },
    });

    expect(onValueChange).toHaveBeenCalledWith(['alpha', 'beta']);
  });
});
