import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MultiSelect } from './MultiSelect';

const options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

describe('MultiSelect', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders an accessible trigger button', () => {
    render(<MultiSelect options={options} label="Fruits" />);
    const trigger = screen.getByRole('combobox', { name: /Fruits/i });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('shows placeholder when nothing is selected', () => {
    render(<MultiSelect options={options} placeholder="Pick fruits" />);
    expect(screen.getByRole('combobox')).toHaveTextContent('Pick fruits');
  });

  it('shows chips for each selected value', () => {
    render(<MultiSelect options={options} value={['apple', 'banana']} />);
    const trigger = screen.getByRole('combobox');
    expect(within(trigger).getByText('Apple')).toBeInTheDocument();
    expect(within(trigger).getByText('Banana')).toBeInTheDocument();
  });

  // ─── Opening / closing ──────────────────────────────────────────────────

  it('opens the listbox on click', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Fruits/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('opens the listbox on Enter key', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    screen.getByRole('combobox', { name: /Fruits/i }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('opens the listbox on Space key', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    screen.getByRole('combobox', { name: /Fruits/i }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('opens the listbox on ArrowDown key', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    screen.getByRole('combobox', { name: /Fruits/i }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('closes the listbox on Escape key', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('keeps the listbox open after selecting an option', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  // ─── Selection / deselection (chip toggling) ────────────────────────────

  it('calls onValueChange with the added value on first click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} label="Fruits" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onValueChange).toHaveBeenCalledWith(['apple']);
  });

  it('adds multiple values by clicking multiple options', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} label="Fruits" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['apple', 'banana']);
  });

  it('removes a value when a selected option is clicked again (chip removal)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <MultiSelect
        options={options}
        value={['apple', 'banana']}
        onValueChange={onValueChange}
        label="Fruits"
      />,
    );
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onValueChange).toHaveBeenCalledWith(['banana']);
  });

  it('marks selected options with aria-selected=true', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} value={['apple']} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('selects an option via Enter after keyboard navigation', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} label="Fruits" onValueChange={onValueChange} />);
    screen.getByRole('combobox', { name: /Fruits/i }).focus();
    await user.keyboard('{ArrowDown}'); // open
    await user.keyboard('{ArrowDown}'); // move to Banana
    await user.keyboard('{Enter}'); // toggle Banana
    expect(onValueChange).toHaveBeenCalledWith(['banana']);
  });

  // ─── ARIA ────────────────────────────────────────────────────────────────

  it('sets aria-multiselectable on the listbox', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  it('marks the active option during ArrowDown navigation', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    screen.getByRole('combobox', { name: /Fruits/i }).focus();
    await user.keyboard('{ArrowDown}'); // open, active = Apple
    await user.keyboard('{ArrowDown}'); // active = Banana
    expect(within(screen.getByRole('listbox')).getByRole('option', { name: 'Banana' })).toHaveClass(
      'pf-multi-select__option--active',
    );
  });

  it('jumps to last enabled option on End key', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.keyboard('{End}');
    // Cherry is disabled so last enabled is Banana
    expect(within(screen.getByRole('listbox')).getByRole('option', { name: 'Banana' })).toHaveClass(
      'pf-multi-select__option--active',
    );
  });

  it('jumps to first enabled option on Home key', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.keyboard('{End}');
    await user.keyboard('{Home}');
    expect(within(screen.getByRole('listbox')).getByRole('option', { name: 'Apple' })).toHaveClass(
      'pf-multi-select__option--active',
    );
  });

  // ─── Disabled states ─────────────────────────────────────────────────────

  it('is disabled when the disabled prop is set', () => {
    render(<MultiSelect options={options} label="Fruits" disabled />);
    expect(screen.getByRole('combobox', { name: /Fruits/i })).toBeDisabled();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" disabled />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks disabled options with aria-disabled', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={options} label="Fruits" />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not toggle a disabled option on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<MultiSelect options={options} label="Fruits" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('combobox', { name: /Fruits/i }));
    await user.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  // ─── Field: label, description, error, required ──────────────────────────

  it('shows a description', () => {
    render(<MultiSelect options={options} label="Fruits" description="Select all that apply" />);
    expect(screen.getByText('Select all that apply')).toBeInTheDocument();
  });

  it('shows an error message', () => {
    render(
      <MultiSelect options={options} label="Fruits" error="At least one selection required" />,
    );
    expect(screen.getByText('At least one selection required')).toBeInTheDocument();
  });

  it('shows the required asterisk and sets aria-required on the trigger', () => {
    render(<MultiSelect options={options} label="Fruits" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Fruits/i })).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  // ─── Form integration ────────────────────────────────────────────────────

  it('renders one hidden input per selected value when name is provided', () => {
    const { container } = render(
      <MultiSelect options={options} name="fruits" value={['apple', 'banana']} />,
    );
    const inputs = container.querySelectorAll('input[type="hidden"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute('name', 'fruits');
    expect(inputs[0]).toHaveAttribute('value', 'apple');
    expect(inputs[1]).toHaveAttribute('value', 'banana');
  });

  it('renders no hidden inputs when nothing is selected', () => {
    const { container } = render(<MultiSelect options={options} name="fruits" />);
    expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
  });
});
