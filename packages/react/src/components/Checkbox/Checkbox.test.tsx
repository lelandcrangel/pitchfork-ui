import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a checkbox input', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('associates the label with the checkbox via htmlFor', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBeInTheDocument();
    const label = screen.getByText('Accept terms');
    expect(label).toHaveAttribute('for', screen.getByRole('checkbox').id);
  });

  it('renders without a label when label prop is omitted', () => {
    render(<Checkbox aria-label="Subscribe" />);
    expect(screen.getByRole('checkbox', { name: 'Subscribe' })).toBeInTheDocument();
    expect(screen.queryByText('Subscribe')).not.toBeInTheDocument();
  });

  // ─── Checked state ───────────────────────────────────────────────────────

  it('is unchecked by default', () => {
    render(<Checkbox label="Option" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('is checked when defaultChecked is true (uncontrolled)', () => {
    render(<Checkbox label="Option" defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('reflects the controlled checked state', () => {
    render(<Checkbox label="Option" checked onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Option" onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('toggles from unchecked to checked in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Option" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  // ─── Indeterminate state ─────────────────────────────────────────────────

  it('sets the indeterminate property when passed via ref', () => {
    let inputRef: HTMLInputElement | null = null;
    render(
      <Checkbox
        label="Select all"
        ref={(el) => {
          inputRef = el;
          if (el) el.indeterminate = true;
        }}
      />,
    );
    expect(inputRef).not.toBeNull();
    expect((inputRef as HTMLInputElement | null)?.indeterminate).toBe(true);
  });

  it('is accessible with indeterminate state via aria-checked', () => {
    render(<Checkbox label="Select all" aria-checked="mixed" readOnly />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('is disabled when the disabled prop is set', () => {
    render(<Checkbox label="Option" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('does not call onChange when disabled and clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Option" disabled onChange={onChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });

  // ─── Required ────────────────────────────────────────────────────────────

  it('sets the required attribute', () => {
    render(<Checkbox label="Option" required />);
    expect(screen.getByRole('checkbox')).toBeRequired();
  });
});
