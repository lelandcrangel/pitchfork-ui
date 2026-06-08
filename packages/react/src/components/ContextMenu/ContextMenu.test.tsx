import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContextMenu, type ContextMenuEntry } from './ContextMenu';

const makeItems = (): ContextMenuEntry[] => [
  { id: 'copy', label: 'Copy', onSelect: vi.fn(), shortcut: '⌘C' },
  { id: 'paste', label: 'Paste', onSelect: vi.fn() },
  { separator: true },
  { id: 'delete', label: 'Delete', onSelect: vi.fn(), destructive: true },
  { id: 'locked', label: 'Locked', onSelect: vi.fn(), disabled: true },
];

const openMenu = () => {
  fireEvent.contextMenu(screen.getByTestId('target'), { clientX: 50, clientY: 50 });
};

function Fixture({ items }: { items: ContextMenuEntry[] }) {
  return (
    <ContextMenu items={items}>
      <div data-testid="target">Right-click me</div>
    </ContextMenu>
  );
}

describe('ContextMenu', () => {
  it('is closed until right-click', () => {
    render(<Fixture items={makeItems()} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens a menu of menuitems on contextmenu', () => {
    render(<Fixture items={makeItems()} />);
    openMenu();
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /copy/i })).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('renders shortcuts and a destructive item', () => {
    render(<Fixture items={makeItems()} />);
    openMenu();
    expect(screen.getByText('⌘C')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass(
      'pf-context-menu__item--destructive',
    );
  });

  it('calls onSelect and closes when an item is clicked', async () => {
    const items = makeItems();
    render(<Fixture items={items} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /paste/i }));
    expect((items[1] as { onSelect: () => void }).onSelect).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('selects the active item with the keyboard', () => {
    const items = makeItems();
    render(<Fixture items={items} />);
    openMenu();
    const menu = screen.getByRole('menu');
    // first enabled is Copy (index 0); ArrowDown → Paste; Enter selects it
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect((items[1] as { onSelect: () => void }).onSelect).toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    render(<Fixture items={makeItems()} />);
    openMenu();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('does not select a disabled item', () => {
    const items = makeItems();
    render(<Fixture items={items} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Locked' }));
    expect((items[4] as { onSelect: () => void }).onSelect).not.toHaveBeenCalled();
  });

  it('falls back to native menu when disabled', () => {
    render(
      <ContextMenu items={makeItems()} disabled>
        <div data-testid="target">x</div>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId('target'), { clientX: 10, clientY: 10 });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
