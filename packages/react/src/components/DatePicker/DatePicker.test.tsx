import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from './DatePicker';

// Fixed month so calendar grid is predictable across runs
const JUNE_15 = new Date(2024, 5, 15, 12, 0, 0); // June 15 2024
const JUNE_1 = new Date(2024, 5, 1, 12, 0, 0);

/** Find a gridcell by day number that belongs to the current month. */
function getDayCell(day: number) {
  return screen
    .getAllByRole('gridcell')
    .find(
      (el) =>
        el.textContent?.trim() === String(day) &&
        !el.classList.contains('pf-calendar__day--outside'),
    )!;
}

describe('DatePicker', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a trigger button with the placeholder', () => {
    render(<DatePicker placeholder="Pick a date" label="Date" />);
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveTextContent('Pick a date');
  });

  it('shows a formatted date when a controlled value is set', () => {
    render(<DatePicker value={JUNE_15} label="Date" />);
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveTextContent('Jun 15, 2024');
  });

  it('shows a formatted date from defaultValue (uncontrolled)', () => {
    render(<DatePicker defaultValue={JUNE_15} label="Date" />);
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveTextContent('Jun 15, 2024');
  });

  it('has aria-haspopup=dialog on the trigger', () => {
    render(<DatePicker label="Date" />);
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });

  // ─── Opening / closing ──────────────────────────────────────────────────

  it('opens the calendar popover on click', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={JUNE_1} />);
    await user.click(screen.getByRole('combobox', { name: /Date/i }));
    expect(screen.getByRole('dialog', { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('opens the calendar on Enter key', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={JUNE_1} />);
    screen.getByRole('combobox', { name: /Date/i }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: /calendar/i })).toBeInTheDocument();
  });

  it('closes the calendar on Escape key', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={JUNE_1} />);
    await user.click(screen.getByRole('combobox', { name: /Date/i }));
    expect(screen.getByRole('dialog', { name: /calendar/i })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /calendar/i })).not.toBeInTheDocument();
  });

  it('closes the calendar after a date is selected', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={JUNE_1} onValueChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox', { name: /Date/i }));
    await user.click(getDayCell(20));
    expect(screen.queryByRole('dialog', { name: /calendar/i })).not.toBeInTheDocument();
  });

  // ─── Date selection ──────────────────────────────────────────────────────

  it('calls onValueChange with the selected Date when a day is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker label="Date" value={JUNE_1} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('combobox', { name: /Date/i }));
    await user.click(getDayCell(20));
    expect(onValueChange).toHaveBeenCalledOnce();
    const called = onValueChange.mock.calls[0][0] as Date;
    expect(called.getMonth()).toBe(5); // June
    expect(called.getDate()).toBe(20);
  });

  it('updates the displayed date after selection (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" defaultValue={JUNE_1} />);
    await user.click(screen.getByRole('combobox', { name: /Date/i }));
    await user.click(getDayCell(20));
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveTextContent('Jun 20, 2024');
  });

  it('marks the selected date in the calendar grid', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" value={JUNE_15} />);
    await user.click(screen.getByRole('combobox', { name: /Date/i }));
    expect(getDayCell(15)).toHaveAttribute('aria-selected', 'true');
    expect(getDayCell(20)).toHaveAttribute('aria-selected', 'false');
  });

  // ─── Clear ───────────────────────────────────────────────────────────────

  it('shows a clear button when allowClear is true and a date is selected', () => {
    render(<DatePicker label="Date" value={JUNE_15} allowClear />);
    expect(screen.getByRole('button', { name: /Clear selected date/i })).toBeInTheDocument();
  });

  it('does not show a clear button when no date is selected', () => {
    render(<DatePicker label="Date" allowClear />);
    expect(screen.queryByRole('button', { name: /Clear selected date/i })).not.toBeInTheDocument();
  });

  it('calls onValueChange with undefined when clear is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker label="Date" value={JUNE_15} allowClear onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: /Clear selected date/i }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it('clears the displayed date (uncontrolled) when clear is clicked', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" defaultValue={JUNE_15} allowClear />);
    await user.click(screen.getByRole('button', { name: /Clear selected date/i }));
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveTextContent('Select a date');
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('disables the trigger when disabled prop is set', () => {
    render(<DatePicker label="Date" disabled />);
    expect(screen.getByRole('combobox', { name: /Date/i })).toBeDisabled();
  });

  it('does not open the calendar when disabled', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" disabled />);
    await user.click(screen.getByRole('combobox', { name: /Date/i }));
    expect(screen.queryByRole('dialog', { name: /calendar/i })).not.toBeInTheDocument();
  });

  // ─── Field: label, description, error, required ──────────────────────────

  it('associates the label with the trigger', () => {
    render(<DatePicker label="Date" />);
    const trigger = screen.getByRole('combobox', { name: /Date/i });
    const label = screen.getByText('Date');
    expect(label).toHaveAttribute('for', trigger.id);
  });

  it('shows a description', () => {
    render(<DatePicker label="Date" description="MM/DD/YYYY format" />);
    expect(screen.getByText('MM/DD/YYYY format')).toBeInTheDocument();
  });

  it('shows an error message and marks the trigger as aria-invalid', () => {
    render(<DatePicker label="Date" error="Date is required" />);
    expect(screen.getByText('Date is required')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the required asterisk and sets aria-required on the trigger', () => {
    render(<DatePicker label="Date" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Date/i })).toHaveAttribute(
      'aria-required',
      'true',
    );
  });
});
