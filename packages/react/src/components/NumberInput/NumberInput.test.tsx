import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('renders a spinbutton with label and value bounds', () => {
    render(<NumberInput label="Quantity" min={0} max={10} defaultValue={3} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveValue('3');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
    expect(input).toHaveAttribute('aria-valuenow', '3');
  });

  it('increments and decrements with the stepper buttons', () => {
    const onValueChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={1} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(onValueChange).toHaveBeenLastCalledWith(2);
    expect(input).toHaveValue('2');
    expect(input).toHaveAttribute('aria-valuenow', '2');
    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }));
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    expect(input).toHaveValue('1');
  });

  it('keeps the displayed value in sync across repeated steps (uncontrolled)', () => {
    render(<NumberInput label="Quantity" defaultValue={0} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    const increase = screen.getByRole('button', { name: 'Increase' });
    fireEvent.click(increase);
    fireEvent.click(increase);
    fireEvent.click(increase);
    expect(input).toHaveValue('3');
  });

  it('steps with ArrowUp / ArrowDown', () => {
    const onValueChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={5} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(onValueChange).toHaveBeenLastCalledWith(6);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(onValueChange).toHaveBeenLastCalledWith(5);
  });

  it('clamps to min and max', () => {
    const onValueChange = vi.fn();
    render(
      <NumberInput
        label="Quantity"
        min={0}
        max={2}
        defaultValue={2}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    // Already at max — value stays clamped and the button is disabled.
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
  });

  it('respects step and decimal precision', () => {
    const onValueChange = vi.fn();
    render(
      <NumberInput label="Amount" step={0.1} defaultValue={1} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Increase' }));
    expect(onValueChange).toHaveBeenLastCalledWith(1.1);
  });

  it('clears to null when emptied', () => {
    const onValueChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={4} onValueChange={onValueChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    fireEvent.change(input, { target: { value: '' } });
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });
});
