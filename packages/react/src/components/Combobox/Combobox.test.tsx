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

  // ─── Clear button ──────────────────────────────────────────────────────────

  it('shows the clear button only when there is a value to clear', () => {
    render(<Combobox options={options} label="Fruit" />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.change(input, { target: { value: 'ap' } });
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('clears the query and value and restores focus', () => {
    const onValueChange = vi.fn();
    render(<Combobox options={options} label="Fruit" onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.click(input);
    fireEvent.click(screen.getByText('Banana'));
    expect(input).toHaveValue('Banana');

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(input).toHaveValue('');
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(input).toHaveFocus();
  });

  it('uses a custom clearLabel', () => {
    render(<Combobox options={options} label="Fruit" defaultValue="apple" clearLabel="Reset" />);
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('hides the clear button when clearable is false', () => {
    render(<Combobox options={options} label="Fruit" defaultValue="apple" clearable={false} />);
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  /* ─── Keyboard ─────────────────────────────────────────────────────────── *
   *
   * All four of these behaviours come from core's `resolveListMove`, which
   * `Select` and both elements already used. This component clamped with
   * `Math.min`/`Math.max` instead: the arrows stopped at the ends where
   * `Select` next door wrapped, `Home` and `End` did nothing, and a disabled
   * option could be left active with Enter then doing nothing at all.
   */

  const activeOptionOf = (input: HTMLElement) => {
    const id = input.getAttribute('aria-activedescendant');
    return id ? document.getElementById(id)?.textContent : null;
  };

  const openList = () => {
    render(<Combobox options={options} label="Fruit" />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.click(input);
    return input;
  };

  it('wraps past the last option and before the first', () => {
    const input = openList();

    // Apple, Banana, (Cherry disabled), Date -> three enabled options.
    expect(activeOptionOf(input)).toBe('Apple');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(activeOptionOf(input)).toBe('Banana');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(activeOptionOf(input)).toBe('Date');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(activeOptionOf(input)).toBe('Apple');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(activeOptionOf(input)).toBe('Date');
  });

  it('skips a disabled option rather than stranding the keyboard on it', () => {
    const input = openList();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    // Cherry sits between Banana and Date and is never active.
    expect(activeOptionOf(input)).toBe('Date');
  });

  it('answers Home and End', () => {
    const input = openList();

    fireEvent.keyDown(input, { key: 'End' });
    expect(activeOptionOf(input)).toBe('Date');
    fireEvent.keyDown(input, { key: 'Home' });
    expect(activeOptionOf(input)).toBe('Apple');
  });

  /*
   * The active option has to be re-established against the *filtered* list.
   * Resetting it in the change handler sees the previous render's options, so
   * index 0 of those may not exist in these.
   */
  it('activates the first match of a newly filtered list', () => {
    const input = openList();

    fireEvent.keyDown(input, { key: 'End' });
    expect(activeOptionOf(input)).toBe('Date');

    fireEvent.change(input, { target: { value: 'ban' } });
    expect(activeOptionOf(input)).toBe('Banana');
  });

  it('enters on the active option after wrapping', () => {
    const onValueChange = vi.fn();
    render(<Combobox options={options} label="Fruit" onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: 'Fruit' });
    fireEvent.click(input);

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onValueChange).toHaveBeenCalledWith('date');
  });
});
