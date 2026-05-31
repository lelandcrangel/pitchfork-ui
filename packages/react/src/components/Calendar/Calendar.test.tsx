import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Calendar } from './Calendar';

// Pin the display month so tests are deterministic
const JUNE_2024 = new Date(2024, 5, 1, 12);
const JUNE_15_2024 = new Date(2024, 5, 15, 12);

/** Get a gridcell for a day that is in the current month. */
const getDayCell = (day: number) =>
  screen
    .getAllByRole('gridcell')
    .find(
      (el) =>
        el.textContent?.trim() === String(day) &&
        !el.classList.contains('pf-calendar__day--outside'),
    )!;

describe('Calendar', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a grid with day cells', () => {
    render(<Calendar value={JUNE_2024} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
  });

  it('shows the current month label in the grid aria-label', () => {
    render(<Calendar value={JUNE_2024} />);
    expect(screen.getByRole('grid', { name: /June 2024/i })).toBeInTheDocument();
  });

  it('renders prev and next month navigation buttons', () => {
    render(<Calendar value={JUNE_2024} />);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
  });

  // ─── Month navigation ────────────────────────────────────────────────────

  it('advances to the next month on Next month click', async () => {
    const user = userEvent.setup();
    render(<Calendar value={JUNE_2024} />);
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid', { name: /July 2024/i })).toBeInTheDocument();
  });

  it('goes back to the previous month on Previous month click', async () => {
    const user = userEvent.setup();
    render(<Calendar value={JUNE_2024} />);
    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid', { name: /May 2024/i })).toBeInTheDocument();
  });

  it('disables Previous month at the start year boundary', () => {
    render(<Calendar startYear={2024} value={new Date(2024, 0, 1, 12)} />);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
  });

  it('disables Next month at the end year boundary', () => {
    render(<Calendar endYear={2024} value={new Date(2024, 11, 1, 12)} />);
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  // ─── Date selection ──────────────────────────────────────────────────────

  it('marks the selected date with aria-selected=true', () => {
    render(<Calendar value={JUNE_15_2024} />);
    expect(getDayCell(15)).toHaveAttribute('aria-selected', 'true');
  });

  it('marks unselected days with aria-selected=false', () => {
    render(<Calendar value={JUNE_15_2024} />);
    expect(getDayCell(20)).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onValueChange with the clicked date', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar value={JUNE_2024} onValueChange={onValueChange} />);
    await user.click(getDayCell(20));
    expect(onValueChange).toHaveBeenCalledOnce();
    const called = onValueChange.mock.calls[0][0] as Date;
    expect(called.getMonth()).toBe(5); // June
    expect(called.getDate()).toBe(20);
  });

  it('updates the selected day in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<Calendar defaultValue={JUNE_2024} />);
    await user.click(getDayCell(10));
    expect(getDayCell(10)).toHaveAttribute('aria-selected', 'true');
  });

  // ─── Disabled dates ───────────────────────────────────────────────────────

  it('disables days matching the disabledDates predicate', () => {
    const disabledDates = (date: Date) => date.getDate() === 20;
    render(<Calendar value={JUNE_2024} disabledDates={disabledDates} />);
    expect(getDayCell(20)).toBeDisabled();
    expect(getDayCell(21)).not.toBeDisabled();
  });

  it('does not call onValueChange when a disabled date is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Calendar
        value={JUNE_2024}
        onValueChange={onValueChange}
        disabledDates={(d) => d.getDate() === 20}
      />,
    );
    await user.click(getDayCell(20));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  // ─── Outside days ─────────────────────────────────────────────────────────

  it('hides outside-month days when showOutsideDays is false', () => {
    render(<Calendar value={JUNE_2024} showOutsideDays={false} />);
    // June 2024 starts on Saturday so May days appear in the first row by default;
    // with showOutsideDays=false they should be hidden (no gridcell, empty spans)
    const gridcells = screen.getAllByRole('gridcell');
    gridcells.forEach((cell) => {
      expect(cell).not.toHaveClass('pf-calendar__day--outside');
    });
  });

  // ─── Field: label, description, error ────────────────────────────────────

  it('shows a label', () => {
    render(<Calendar label="Pick a date" value={JUNE_2024} />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(<Calendar label="Date" error="Date required" value={JUNE_2024} />);
    expect(screen.getByText('Date required')).toBeInTheDocument();
  });
});
