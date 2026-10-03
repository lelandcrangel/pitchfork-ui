import { render, screen } from '@testing-library/react';
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

  /*
   * `aria-disabled`, not `disabled`. The ARIA grid pattern is that focus
   * crosses a blocked day while activation refuses it, and a `disabled`
   * button cannot take focus at all -- so a blocked stretch was uncrossable by
   * keyboard. `pf-calendar` has always done it this way.
   */
  it('marks days matching the disabledDates predicate as aria-disabled', () => {
    const disabledDates = (date: Date) => date.getDate() === 20;
    render(<Calendar value={JUNE_2024} disabledDates={disabledDates} />);
    expect(getDayCell(20)).toHaveAttribute('aria-disabled', 'true');
    expect(getDayCell(21)).not.toHaveAttribute('aria-disabled');
    // Still focusable, which is the whole point.
    expect(getDayCell(20)).not.toBeDisabled();
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

  /* ─── Keyboard ─────────────────────────────────────────────────────────── *
   *
   * This grid rendered 42 buttons and handled no keys at all: reaching the end
   * of a month from its start took 42 presses of Tab, and there was no way to
   * move by week. These mirror `pf-calendar`'s browser spec, and the
   * arithmetic underneath both is core's `moveCalendarDate` and
   * `resolveCalendarKey`.
   */

  const focusedCell = () =>
    screen.getAllByRole('gridcell').find((cell) => cell.getAttribute('tabindex') === '0');

  it('is one tab stop, not forty-two', () => {
    render(<Calendar value={JUNE_15_2024} />);
    const cells = screen.getAllByRole('gridcell');

    expect(cells.length).toBeGreaterThan(28);
    expect(cells.filter((cell) => cell.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(focusedCell()).toBe(getDayCell(15));
  });

  it('moves a day with the left and right arrows', async () => {
    const user = userEvent.setup();
    render(<Calendar value={JUNE_15_2024} />);
    getDayCell(15).focus();

    await user.keyboard('{ArrowRight}');
    expect(focusedCell()).toBe(getDayCell(16));
    expect(getDayCell(16)).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(focusedCell()).toBe(getDayCell(14));
  });

  it('moves a week with the up and down arrows', async () => {
    const user = userEvent.setup();
    render(<Calendar value={JUNE_15_2024} />);
    getDayCell(15).focus();

    await user.keyboard('{ArrowDown}');
    expect(focusedCell()).toBe(getDayCell(22));

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(focusedCell()).toBe(getDayCell(8));
  });

  it('answers Home and End with the ends of the week', async () => {
    const user = userEvent.setup();
    // 15 June 2024 is a Saturday, so its week runs Sunday the 9th to it.
    render(<Calendar value={JUNE_15_2024} />);
    getDayCell(15).focus();

    await user.keyboard('{Home}');
    expect(focusedCell()).toBe(getDayCell(9));

    await user.keyboard('{End}');
    expect(focusedCell()).toBe(getDayCell(15));
  });

  /*
   * Walking off either end has to bring the month with it. Moving the month
   * alone would leave the focused day on a date no longer rendered, so no cell
   * would carry `tabIndex={0}` and the grid would drop out of the tab order
   * altogether — `pf-calendar`'s year picker shipped exactly that.
   */
  it('scrolls the month when the arrows walk out of it', async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2024, 5, 30, 12)} />);
    getDayCell(30).focus();

    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('grid')).toHaveAccessibleName('July 2024');
    expect(focusedCell()).toBe(getDayCell(1));
    expect(getDayCell(1)).toHaveFocus();
  });

  it('moves a month with PageUp and PageDown', async () => {
    const user = userEvent.setup();
    render(<Calendar value={JUNE_15_2024} />);
    getDayCell(15).focus();

    await user.keyboard('{PageDown}');
    expect(screen.getByRole('grid')).toHaveAccessibleName('July 2024');
    expect(focusedCell()).toBe(getDayCell(15));

    await user.keyboard('{PageUp}{PageUp}');
    expect(screen.getByRole('grid')).toHaveAccessibleName('May 2024');
  });

  it('selects the focused day on Enter and on Space', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Calendar value={JUNE_15_2024} onValueChange={onValueChange} />);
    getDayCell(15).focus();

    await user.keyboard('{ArrowRight}{Enter}');
    expect(onValueChange.mock.calls.at(-1)?.[0].getDate()).toBe(16);

    await user.keyboard('{ArrowRight}{ }');
    expect(onValueChange.mock.calls.at(-1)?.[0].getDate()).toBe(17);
  });

  /*
   * Focus crosses a disabled day while activation refuses it. Skipping it
   * would make a long blocked stretch impossible to cross, and that is the
   * ARIA pattern: focus moves freely, activation does not.
   */
  it('focuses a disabled day but will not select it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Calendar
        value={JUNE_15_2024}
        onValueChange={onValueChange}
        disabledDates={(date) => date.getDate() === 16}
      />,
    );
    getDayCell(15).focus();

    await user.keyboard('{ArrowRight}');
    expect(focusedCell()).toBe(getDayCell(16));

    await user.keyboard('{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();

    // And the keyboard can keep going past it.
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onValueChange.mock.calls.at(-1)?.[0].getDate()).toBe(17);
  });

  /*
   * The month buttons move `displayMonth`; the grid has to bring its tab stop
   * along or nothing in it is focusable.
   */
  it('keeps a tab stop after the month buttons change the month', async () => {
    const user = userEvent.setup();
    render(<Calendar value={JUNE_15_2024} />);

    await user.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByRole('grid')).toHaveAccessibleName('July 2024');
    expect(
      screen.getAllByRole('gridcell').filter((c) => c.getAttribute('tabindex') === '0'),
    ).toHaveLength(1);
    expect(focusedCell()).toBe(getDayCell(15));
  });

  /*
   * A month step from the 31st lands on a shorter month's last day rather than
   * overflowing into the month after — `new Date(2024, 1, 31)` is the 2nd of
   * March, and core's `moveCalendarDate` clamps instead.
   */
  it('clamps a month step from the 31st into a shorter month', async () => {
    const user = userEvent.setup();
    render(<Calendar value={new Date(2024, 0, 31, 12)} />);
    getDayCell(31).focus();

    await user.keyboard('{PageDown}');

    expect(screen.getByRole('grid')).toHaveAccessibleName('February 2024');
    expect(focusedCell()).toBe(getDayCell(29));
  });
});
