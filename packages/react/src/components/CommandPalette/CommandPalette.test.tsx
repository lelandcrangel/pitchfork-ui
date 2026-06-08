import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommandPalette, type CommandItem } from './CommandPalette';

const items: CommandItem[] = [
  { id: '1', label: 'New file', group: 'File', onSelect: vi.fn() },
  { id: '2', label: 'Open file', group: 'File', onSelect: vi.fn() },
  { id: '3', label: 'Settings', group: 'App', onSelect: vi.fn() },
  { id: '4', label: 'Disabled item', disabled: true, onSelect: vi.fn() },
];

const noop = () => {};

describe('CommandPalette', () => {
  it('does not render when closed', () => {
    render(<CommandPalette open={false} onOpenChange={noop} items={items} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open with search input and results', () => {
    render(<CommandPalette open={true} onOpenChange={noop} items={items} />);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('New file')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('filters results as the user types', () => {
    render(<CommandPalette open={true} onOpenChange={noop} items={items} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'set' } });
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('New file')).not.toBeInTheDocument();
  });

  it('shows the empty message when nothing matches', () => {
    render(
      <CommandPalette open={true} onOpenChange={noop} items={items} emptyMessage="Nothing here" />,
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('calls onSelect and closes when an item is clicked', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open={true} onOpenChange={onOpenChange} items={items} />);
    fireEvent.click(screen.getByText('Settings'));
    expect(items[2].onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onSelect with Enter on the active item', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open={true} onOpenChange={onOpenChange} items={items} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(items[1].onSelect).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Escape', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open={true} onOpenChange={onOpenChange} items={items} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not call onSelect for a disabled item', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open={true} onOpenChange={onOpenChange} items={items} />);
    fireEvent.click(screen.getByText('Disabled item'));
    expect(items[3].onSelect).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders group labels', () => {
    render(<CommandPalette open={true} onOpenChange={noop} items={items} />);
    expect(screen.getByText('File')).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
  });
});
