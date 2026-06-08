import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption } from './Combobox';

const options: ComboboxOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
];

describe('Combobox', () => {
  it('exposes combobox a11y wiring', () => {
    render(<Combobox options={options} label="Fruit" />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-controls');
  });

  it('opens and filters options by query', () => {
    render(<Combobox options={options} label="Fruit" />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.change(input, { target: { value: 'an' } });
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('selects an option on click and reports the value', () => {
    const onValueChange = vi.fn();
    render(<Combobox options={options} label="Fruit" onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.click(input);
    fireEvent.click(screen.getByText('Banana'));
    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(input).toHaveValue('Banana');
  });

  it('selects the active option with the keyboard', () => {
    const onValueChange = vi.fn();
    render(<Combobox options={options} label="Fruit" onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('banana');
  });

  it('shows an empty message when nothing matches', () => {
    render(<Combobox options={options} label="Fruit" emptyMessage="Nothing here" />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('does not select a disabled option', () => {
    const onValueChange = vi.fn();
    render(<Combobox options={options} label="Fruit" onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.click(input);
    fireEvent.click(screen.getByText('Cherry'));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
