import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup } from './RadioGroup';

const options = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large', disabled: true },
];

describe('RadioGroup', () => {
  // ─── Group structure ─────────────────────────────────────────────────────

  it('renders a fieldset with radio inputs', () => {
    render(<RadioGroup options={options} legend="Size" />);
    expect(screen.getByRole('group', { name: 'Size' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('renders a legend when provided', () => {
    render(<RadioGroup options={options} legend="Size" />);
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('groups all radio inputs under the same name', () => {
    render(<RadioGroup options={options} name="size" />);
    const radios = screen.getAllByRole('radio');
    const names = radios.map((r) => r.getAttribute('name'));
    expect(new Set(names).size).toBe(1);
  });

  it('associates each radio with its label via htmlFor', () => {
    render(<RadioGroup options={options} legend="Size" />);
    expect(screen.getByRole('radio', { name: 'Small' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeInTheDocument();
  });

  it('renders option descriptions when provided', () => {
    const withDesc = [
      { value: 'a', label: 'Option A', description: 'Good choice' },
    ];
    render(<RadioGroup options={withDesc} />);
    expect(screen.getByText('Good choice')).toBeInTheDocument();
  });

  // ─── Selection ───────────────────────────────────────────────────────────

  it('has no option selected by default', () => {
    render(<RadioGroup options={options} />);
    screen.getAllByRole('radio').forEach((r) => expect(r).not.toBeChecked());
  });

  it('pre-selects the defaultValue in uncontrolled mode', () => {
    render(<RadioGroup options={options} defaultValue="md" />);
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Small' })).not.toBeChecked();
  });

  it('reflects the controlled value', () => {
    render(<RadioGroup options={options} value="sm" onValueChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
  });

  it('calls onValueChange with the selected value on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup options={options} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('radio', { name: 'Small' }));
    expect(onValueChange).toHaveBeenCalledWith('sm');
  });

  it('updates selection in uncontrolled mode on click', async () => {
    const user = userEvent.setup();
    render(<RadioGroup options={options} />);
    await user.click(screen.getByRole('radio', { name: 'Small' }));
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Medium' }));
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Small' })).not.toBeChecked();
  });

  // ─── Disabled states ─────────────────────────────────────────────────────

  it('disables all radios when the group disabled prop is set', () => {
    render(<RadioGroup options={options} disabled />);
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });

  it('disables only the specific option when option.disabled is true', () => {
    render(<RadioGroup options={options} />);
    expect(screen.getByRole('radio', { name: 'Large' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Small' })).not.toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Medium' })).not.toBeDisabled();
  });

  it('does not call onValueChange when a disabled option is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup options={options} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('radio', { name: 'Large' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  it('moves selection with arrow keys within the group', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RadioGroup options={options} onValueChange={onValueChange} />);
    screen.getByRole('radio', { name: 'Small' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(onValueChange).toHaveBeenCalledWith('md');
  });

  // ─── Orientation ─────────────────────────────────────────────────────────

  it('applies the horizontal modifier class when orientation is horizontal', () => {
    render(<RadioGroup options={options} orientation="horizontal" />);
    expect(document.querySelector('.pf-radio-group')).toHaveClass(
      'pf-radio-group--horizontal',
    );
  });

  it('does not apply the horizontal class for vertical orientation (default)', () => {
    render(<RadioGroup options={options} />);
    expect(document.querySelector('.pf-radio-group')).not.toHaveClass(
      'pf-radio-group--horizontal',
    );
  });

  // ─── Fieldset group association ──────────────────────────────────────────

  it('renders all radios inside the fieldset', () => {
    render(<RadioGroup options={options} legend="Size" />);
    const fieldset = screen.getByRole('group', { name: 'Size' });
    expect(within(fieldset).getAllByRole('radio')).toHaveLength(3);
  });
});
