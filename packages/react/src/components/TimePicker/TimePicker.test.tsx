import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimePicker } from './TimePicker';

const column = (name: string) => within(screen.getByRole('listbox', { name }));

describe('TimePicker', () => {
  it('renders a trigger with label and placeholder', () => {
    render(<TimePicker label="Start time" placeholder="Pick a time" />);
    const trigger = screen.getByRole('combobox', { name: /start time/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Pick a time');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('shows the formatted value in 24h mode', () => {
    render(<TimePicker label="Time" defaultValue="14:30" />);
    expect(screen.getByRole('combobox', { name: /time/i })).toHaveTextContent('14:30');
  });

  it('shows the formatted value in 12h mode', () => {
    render(<TimePicker label="Time" hourCycle={12} defaultValue="14:30" />);
    expect(screen.getByRole('combobox', { name: /time/i })).toHaveTextContent('2:30 PM');
  });

  it('opens the panel with hour and minute listboxes', () => {
    render(<TimePicker label="Time" />);
    fireEvent.click(screen.getByRole('combobox', { name: /time/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Hour' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Minute' })).toBeInTheDocument();
  });

  it('shows an AM/PM column only in 12h mode', () => {
    const { rerender } = render(<TimePicker label="Time" hourCycle={24} />);
    fireEvent.click(screen.getByRole('combobox', { name: /time/i }));
    expect(screen.queryByRole('listbox', { name: 'AM or PM' })).not.toBeInTheDocument();

    rerender(<TimePicker label="Time" hourCycle={12} />);
    expect(screen.getByRole('listbox', { name: 'AM or PM' })).toBeInTheDocument();
  });

  it('emits a canonical HH:mm value when hour then minute are chosen', () => {
    const onValueChange = vi.fn();
    render(<TimePicker label="Time" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('combobox', { name: /time/i }));

    fireEvent.click(column('Hour').getByRole('option', { name: '09' }));
    expect(onValueChange).toHaveBeenLastCalledWith('09:00');

    fireEvent.click(column('Minute').getByRole('option', { name: '30' }));
    expect(onValueChange).toHaveBeenLastCalledWith('09:30');
  });

  it('respects minuteStep', () => {
    render(<TimePicker label="Time" minuteStep={15} />);
    fireEvent.click(screen.getByRole('combobox', { name: /time/i }));
    const options = column('Minute').getAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['00', '15', '30', '45']);
  });

  it('converts 12h selections to canonical 24h', () => {
    const onValueChange = vi.fn();
    render(
      <TimePicker label="Time" hourCycle={12} defaultValue="09:00" onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole('combobox', { name: /time/i }));
    // Switch to PM — 9 AM becomes 21:00
    fireEvent.click(column('AM or PM').getByRole('option', { name: 'PM' }));
    expect(onValueChange).toHaveBeenLastCalledWith('21:00');
  });

  it('closes on Escape', async () => {
    render(<TimePicker label="Time" />);
    const trigger = screen.getByRole('combobox', { name: /time/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    // usePresence keeps the panel mounted for the exit animation before unmounting.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
