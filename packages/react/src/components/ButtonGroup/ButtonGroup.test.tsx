import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ButtonGroup, type ButtonGroupItem } from './ButtonGroup';

const items: ButtonGroupItem[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

describe('ButtonGroup', () => {
  it('renders all buttons', () => {
    render(<ButtonGroup items={items} />);
    expect(screen.getByRole('button', { name: 'Day' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Month' })).toBeInTheDocument();
  });

  it('wraps buttons in a group role', () => {
    render(<ButtonGroup items={items} />);
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('passes className to the root element', () => {
    render(<ButtonGroup items={items} className="custom-class" />);
    expect(screen.getByRole('group')).toHaveClass('custom-class');
  });

  it('marks the selected button with aria-pressed=true', () => {
    render(<ButtonGroup items={items} value="week" />);
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks unselected buttons with aria-pressed=false', () => {
    render(<ButtonGroup items={items} value="week" />);
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onValueChange with the clicked item value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ButtonGroup items={items} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Month' }));
    expect(onValueChange).toHaveBeenCalledWith('month');
  });

  it('disables all buttons when disabled=true', () => {
    render(<ButtonGroup items={items} disabled />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
  });

  it('disables a specific item when item.disabled=true', () => {
    const withDisabled: ButtonGroupItem[] = [
      ...items,
      { value: 'year', label: 'Year', disabled: true },
    ];
    render(<ButtonGroup items={withDisabled} />);
    expect(screen.getByRole('button', { name: 'Year' })).toBeDisabled();
  });

  it('supports multiple selection mode', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ButtonGroup items={items} multiple onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: 'Day' }));
    await user.click(screen.getByRole('button', { name: 'Week' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['day', 'week']);
  });
});
