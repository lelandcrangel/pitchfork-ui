import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RadioButton } from './RadioButton';

describe('RadioButton', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a radio input', () => {
    render(<RadioButton />);
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('associates the label with the radio via htmlFor', () => {
    render(<RadioButton label="Option A" />);
    expect(screen.getByRole('radio', { name: 'Option A' })).toBeInTheDocument();
    const label = screen.getByText('Option A');
    expect(label).toHaveAttribute('for', screen.getByRole('radio').id);
  });

  it('renders without a label element when label prop is omitted', () => {
    render(<RadioButton aria-label="Yes" />);
    expect(screen.getByRole('radio', { name: 'Yes' })).toBeInTheDocument();
  });

  it('passes extra props through to the native input', () => {
    render(<RadioButton name="size" value="sm" label="Small" />);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('name', 'size');
    expect(radio).toHaveAttribute('value', 'sm');
  });

  // ─── Checked state ───────────────────────────────────────────────────────

  it('is unchecked by default', () => {
    render(<RadioButton label="Option" />);
    expect(screen.getByRole('radio')).not.toBeChecked();
  });

  it('is checked when defaultChecked is true (uncontrolled)', () => {
    render(<RadioButton label="Option" defaultChecked />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('reflects the controlled checked state', () => {
    render(<RadioButton label="Option" checked onChange={vi.fn()} />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioButton label="Option" onChange={onChange} />);
    await user.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  // ─── Group behaviour ─────────────────────────────────────────────────────

  it('only one radio in a same-name group is checked at a time', async () => {
    const user = userEvent.setup();
    render(
      <>
        <RadioButton name="size" value="sm" label="Small" />
        <RadioButton name="size" value="md" label="Medium" />
      </>,
    );
    const small = screen.getByRole('radio', { name: 'Small' });
    const medium = screen.getByRole('radio', { name: 'Medium' });

    await user.click(small);
    expect(small).toBeChecked();
    expect(medium).not.toBeChecked();

    await user.click(medium);
    expect(medium).toBeChecked();
    expect(small).not.toBeChecked();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('is disabled when the disabled prop is set', () => {
    render(<RadioButton label="Option" disabled />);
    expect(screen.getByRole('radio')).toBeDisabled();
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RadioButton label="Option" disabled onChange={onChange} />);
    await user.click(screen.getByRole('radio'));
    expect(onChange).not.toHaveBeenCalled();
  });

  // ─── Ref forwarding ──────────────────────────────────────────────────────

  it('forwards the ref to the native input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<RadioButton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
