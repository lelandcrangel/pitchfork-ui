import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a text input', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('associates the label with the input via htmlFor', () => {
    render(<Input label="Email" />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    const label = screen.getByText('Email');
    expect(label).toHaveAttribute('for', screen.getByRole('textbox').id);
  });

  it('renders without a label element when label prop is omitted', () => {
    render(<Input placeholder="Search" />);
    expect(screen.queryByText(/label/i)).not.toBeInTheDocument();
  });

  it('passes extra props through to the native input', () => {
    render(<Input type="email" placeholder="you@example.com" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
  });

  // ─── Value ───────────────────────────────────────────────────────────────

  it('shows the controlled value', () => {
    render(<Input value="hello" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('hello');
  });

  it('shows the defaultValue in uncontrolled mode', () => {
    render(<Input defaultValue="world" />);
    expect(screen.getByRole('textbox')).toHaveValue('world');
  });

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('updates value in uncontrolled mode as the user types', async () => {
    const user = userEvent.setup();
    render(<Input />);
    await user.type(screen.getByRole('textbox'), 'typed');
    expect(screen.getByRole('textbox')).toHaveValue('typed');
  });

  // ─── Field: description, error, required ─────────────────────────────────

  it('shows a description', () => {
    render(<Input label="Email" description="We will never share your email." />);
    expect(screen.getByText('We will never share your email.')).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(<Input label="Email" error="Invalid email address." />);
    expect(screen.getByText('Invalid email address.')).toBeInTheDocument();
  });

  it('sets aria-invalid when error is provided', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when there is no error', () => {
    render(<Input label="Email" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
  });

  it('wires aria-describedby to the description and error elements', () => {
    render(<Input label="Email" description="Hint" error="Error" />);
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy.split(' ')[0])).toBeInTheDocument();
    expect(document.getElementById(describedBy.split(' ')[1])).toBeInTheDocument();
  });

  it('shows the required asterisk and sets native required', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('disables the input when disabled prop is set', () => {
    render(<Input label="Email" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input disabled onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).not.toHaveBeenCalled();
  });

  // ─── Ref forwarding ──────────────────────────────────────────────────────

  it('forwards the ref to the native input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
