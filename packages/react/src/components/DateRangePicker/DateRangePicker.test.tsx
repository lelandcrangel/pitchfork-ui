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

  /* ─── Keyboard ─────────────────────────────────────────────────────────── *
   *
   * The grid is shared with `Calendar`, so the keyboard arrived here with it.
   * What is specific to this component is the two panels: they show
   * consecutive months off one `leftMonth`, so the keyboard walking out of
   * either one has to move that single piece of state the right way.
   */

  const focusedCells = () =>
    screen.getAllByRole('gridcell').filter((cell) => cell.getAttribute('tabindex') === '0');

  /*
   * On the cell, not on the grid: the handler lives on the day buttons,
   * because the `role="grid"` container never takes focus and a key always
   * arrives at a cell. A synthetic event on the container would not reach
   * them -- React events bubble up, not down -- so a test written that way
   * passes or fails for the wrong reason.
   */
  const pressOnPanel = (panel: 0 | 1, key: string) =>
    fireEvent.keyDown(focusedCells()[panel], { key });

  it('gives each of the two months one tab stop', () => {
    render(
      <DateRangePicker
        label="Dates"
        defaultValue={{ start: new Date(2025, 0, 10, 12), end: new Date(2025, 1, 15, 12) }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /dates/i }));

    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(focusedCells()).toHaveLength(2);
  });

  it('moves the focused day with the arrows', () => {
    render(
      <DateRangePicker
        label="Dates"
        defaultValue={{ start: new Date(2025, 0, 10, 12), end: null }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /dates/i }));

    expect(focusedCells()[0]).toHaveAccessibleName('January 10, 2025');

    pressOnPanel(0, 'ArrowDown');
    expect(focusedCells()[0]).toHaveAccessibleName('January 17, 2025');
  });

  /*
   * Walking off the end of the *right* panel moves `leftMonth` forward by one,
   * not to the month the keyboard landed in -- the right panel is always one
   * month ahead of it. Getting that backwards scrolls two months at a time.
   */
  it('scrolls both panels by one month when the right panel walks out of its month', () => {
    render(
      <DateRangePicker
        label="Dates"
        defaultValue={{ start: new Date(2025, 0, 10, 12), end: new Date(2025, 1, 28, 12) }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /dates/i }));

    const grids = screen.getAllByRole('grid');
    expect(grids[0]).toHaveAccessibleName('January 2025');
    expect(grids[1]).toHaveAccessibleName('February 2025');

    pressOnPanel(1, 'ArrowRight');

    const moved = screen.getAllByRole('grid');
    expect(moved[0]).toHaveAccessibleName('February 2025');
    expect(moved[1]).toHaveAccessibleName('March 2025');
  });
});
