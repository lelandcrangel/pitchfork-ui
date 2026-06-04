import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

describe('Select', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders an accessible trigger button', () => {
    render(<Select options={options} label="Fruit" />);
    const trigger = screen.getByRole('button', { name: /Fruit/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('shows placeholder when no value is selected', () => {
    render(<Select options={options} placeholder="Pick one" />);
    expect(screen.getByRole('button')).toHaveTextContent('Pick one');
  });

  it('shows the selected option label when a value is provided', () => {
    render(<Select options={options} value="banana" />);
    expect(screen.getByRole('button')).toHaveTextContent('Banana');
  });

  // ─── Opening / closing ──────────────────────────────────────────────────

  it('opens the listbox on click', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fruit/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens the listbox on Enter key', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    screen.getByRole('button', { name: /Fruit/i }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('opens the listbox on Space key', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    screen.getByRole('button', { name: /Fruit/i }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('opens the listbox on ArrowDown key', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    screen.getByRole('button', { name: /Fruit/i }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes the listbox on Escape key', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the listbox after an option is selected', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // ─── Selection ──────────────────────────────────────────────────────────

  it('calls onValueChange with the selected value on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select options={options} label="Fruit" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenCalledWith('banana');
  });

  it('selects an option via Enter after ArrowDown navigation', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select options={options} label="Fruit" onValueChange={onValueChange} />);
    screen.getByRole('button', { name: /Fruit/i }).focus();
    await user.keyboard('{ArrowDown}'); // open
    await user.keyboard('{ArrowDown}'); // move to Banana
    await user.keyboard('{Enter}'); // confirm
    expect(onValueChange).toHaveBeenCalledWith('banana');
  });

  it('updates the displayed label after selection', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.getByRole('button', { name: /Fruit/i })).toHaveTextContent('Apple');
  });

  it('respects a controlled value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select options={options} value="apple" onValueChange={onValueChange} label="Fruit" />);
    expect(screen.getByRole('button', { name: /Fruit/i })).toHaveTextContent('Apple');
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  it('marks the active option during keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    screen.getByRole('button', { name: /Fruit/i }).focus();
    await user.keyboard('{ArrowDown}'); // open, active = Apple (firstEnabled)
    await user.keyboard('{ArrowDown}'); // active = Banana
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: 'Banana' })).toHaveClass(
      'pf-select__option--active',
    );
  });

  it('jumps to the last enabled option on End key', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    await user.keyboard('{End}');
    // Cherry is disabled so last enabled is Banana
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: 'Banana' })).toHaveClass(
      'pf-select__option--active',
    );
  });

  it('jumps to the first enabled option on Home key', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    await user.keyboard('{End}');
    await user.keyboard('{Home}');
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: 'Apple' })).toHaveClass(
      'pf-select__option--active',
    );
  });

  // ─── Disabled states ─────────────────────────────────────────────────────

  it('is disabled when the disabled prop is set', () => {
    render(<Select options={options} label="Fruit" disabled />);
    expect(screen.getByRole('button', { name: /Fruit/i })).toBeDisabled();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" disabled />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks disabled options with aria-disabled', async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Fruit" />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not select a disabled option on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select options={options} label="Fruit" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: /Fruit/i }));
    await user.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onValueChange).not.toHaveBeenCalled();
    // Listbox should remain open
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  // ─── Field: label, description, error, required ──────────────────────────

  it('associates the label with the trigger via htmlFor', () => {
    render(<Select options={options} label="Fruit" />);
    const trigger = screen.getByRole('button', { name: /Fruit/i });
    const label = screen.getByText('Fruit');
    expect(label).toHaveAttribute('for', trigger.id);
  });

  it('shows a description', () => {
    render(<Select options={options} label="Fruit" description="Pick your favorite" />);
    expect(screen.getByText('Pick your favorite')).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(<Select options={options} label="Fruit" error="Selection is required" />);
    expect(screen.getByText('Selection is required')).toBeInTheDocument();
  });

  it('shows the required asterisk and sets aria-required on the trigger', () => {
    render(<Select options={options} label="Fruit" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fruit/i })).toHaveAttribute('aria-required', 'true');
  });

  // ─── Form integration ────────────────────────────────────────────────────

  it('renders a hidden input when name is provided', () => {
    const { container } = render(<Select options={options} name="fruit" value="banana" />);
    const hidden = container.querySelector('input[type="hidden"]');
    expect(hidden).toHaveAttribute('name', 'fruit');
    expect(hidden).toHaveAttribute('value', 'banana');
  });

  it('clears the hidden input value when no option is selected', () => {
    const { container } = render(<Select options={options} name="fruit" />);
    const hidden = container.querySelector('input[type="hidden"]');
    expect(hidden).toHaveAttribute('value', '');
  });
});
