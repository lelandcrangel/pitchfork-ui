import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from './DateRangePicker';

describe('DateRangePicker', () => {
  it('renders a trigger button with label', () => {
    render(<DateRangePicker label="Stay dates" />);
    expect(screen.getByRole('button', { name: /stay dates/i })).toBeInTheDocument();
  });

  it('opens the calendar dialog on trigger click', () => {
    render(<DateRangePicker label="Dates" />);
    fireEvent.click(screen.getByRole('button', { name: /dates/i }));
    expect(screen.getByRole('dialog', { name: /date range picker/i })).toBeInTheDocument();
  });

  it('selects a start then end date and fires onValueChange', () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker label="Dates" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: /dates/i }));

    // Click a day for start — any available gridcell
    const days = screen.getAllByRole('gridcell');
    fireEvent.click(days[10]);
    // Start chosen — onValueChange fired with end: null
    expect(onValueChange).toHaveBeenCalledWith(expect.objectContaining({ end: null }));

    // Click a later day for end
    fireEvent.click(days[15]);
    expect(onValueChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date),
      }),
    );
  });

  it('shows the hint text prompting which date to choose', () => {
    render(<DateRangePicker label="Dates" />);
    fireEvent.click(screen.getByRole('button', { name: /dates/i }));
    expect(screen.getByText(/select a start date/i)).toBeInTheDocument();

    const days = screen.getAllByRole('gridcell');
    fireEvent.click(days[10]);
    expect(screen.getByText(/select an end date/i)).toBeInTheDocument();
  });

  it('closes on Escape and reverts selecting state', () => {
    render(<DateRangePicker label="Dates" />);
    fireEvent.click(screen.getByRole('button', { name: /dates/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a clear button when a range is set', () => {
    render(
      <DateRangePicker
        label="Dates"
        defaultValue={{ start: new Date(2025, 0, 10), end: new Date(2025, 0, 15) }}
      />,
    );
    expect(screen.getByRole('button', { name: /clear date range/i })).toBeInTheDocument();
  });

  it('clears the range when the clear button is clicked', () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        label="Dates"
        defaultValue={{ start: new Date(2025, 0, 10), end: new Date(2025, 0, 15) }}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /clear date range/i }));
    expect(onValueChange).toHaveBeenCalledWith({ start: null, end: null });
  });
});
