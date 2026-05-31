import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a textarea', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('defaults to 4 rows', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '4');
  });

  it('applies a custom rows value', () => {
    render(<Textarea rows={8} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  it('associates the label with the textarea via htmlFor', () => {
    render(<Textarea label="Message" />);
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
    const label = screen.getByText('Message');
    expect(label).toHaveAttribute('for', screen.getByRole('textbox').id);
  });

  it('passes extra props through to the native textarea', () => {
    render(<Textarea placeholder="Write something…" maxLength={200} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Write something…');
    expect(textarea).toHaveAttribute('maxlength', '200');
  });

  // ─── Value ───────────────────────────────────────────────────────────────

  it('shows the controlled value', () => {
    render(<Textarea value="hello" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('shows the defaultValue in uncontrolled mode', () => {
    render(<Textarea defaultValue="world" />);
    expect(screen.getByRole('textbox')).toHaveValue('world');
  });

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('updates value in uncontrolled mode as the user types', async () => {
    const user = userEvent.setup();
    render(<Textarea />);
    await user.type(screen.getByRole('textbox'), 'typed text');
    expect(screen.getByRole('textbox')).toHaveValue('typed text');
  });

  // ─── Field: description, error, required ─────────────────────────────────

  it('shows a description', () => {
    render(<Textarea label="Message" description="Max 500 characters." />);
    expect(screen.getByText('Max 500 characters.')).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(<Textarea label="Message" error="Message is required." />);
    expect(screen.getByText('Message is required.')).toBeInTheDocument();
  });

  it('sets aria-invalid when error is provided', () => {
    render(<Textarea label="Message" error="Required" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when there is no error', () => {
    render(<Textarea label="Message" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('shows the required asterisk and sets native required', () => {
    render(<Textarea label="Message" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('disables the textarea when disabled prop is set', () => {
    render(<Textarea label="Message" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea disabled onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).not.toHaveBeenCalled();
  });

  // ─── Ref forwarding ──────────────────────────────────────────────────────

  it('forwards the ref to the native textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
