import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dropdown } from './Dropdown';

const items = [
  { label: 'Edit', onSelect: vi.fn() },
  { label: 'Duplicate', onSelect: vi.fn() },
  { label: 'Delete', onSelect: vi.fn(), disabled: true },
  { label: 'Remove', onSelect: vi.fn(), destructive: true },
];

describe('Dropdown', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a trigger button with aria-haspopup=menu', () => {
    render(<Dropdown items={items} label="Actions" />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  });

  it('does not show the menu by default', () => {
    render(<Dropdown items={items} label="Actions" />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  // ─── Opening / closing ──────────────────────────────────────────────────

  it('opens the menu on click', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('opens the menu on Enter key', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('opens the menu on Space key', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('opens the menu on ArrowDown key', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the menu on Escape key', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu after an item is selected', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('toggles closed when trigger is clicked while open', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  // ─── Item rendering ──────────────────────────────────────────────────────

  it('renders all items as menuitems', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(4);
  });

  it('marks disabled items with the disabled attribute', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeDisabled();
  });

  it('applies the destructive class to destructive items', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveClass(
      'pf-dropdown__item--destructive',
    );
  });

  it('renders an icon when provided', async () => {
    const user = userEvent.setup();
    const withIcon = [{ label: 'Copy', icon: <span data-testid="icon" /> }];
    render(<Dropdown items={withIcon} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders a keyboard shortcut when provided', async () => {
    const user = userEvent.setup();
    const withShortcut = [{ label: 'Copy', shortcut: '⌘C' }];
    render(<Dropdown items={withShortcut} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByText('⌘C')).toBeInTheDocument();
  });

  // ─── Selection ───────────────────────────────────────────────────────────

  it('calls onSelect when an enabled item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Dropdown items={[{ label: 'Edit', onSelect }]} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('does not call onSelect when a disabled item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Dropdown items={[{ label: 'Delete', onSelect, disabled: true }]} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  it('highlights the first enabled item on open', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveClass('pf-dropdown__item--active');
  });

  it('moves the active item on ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveClass(
      'pf-dropdown__item--active',
    );
  });

  // ─── Disabled trigger ────────────────────────────────────────────────────

  it('disables the trigger when disabled prop is set', () => {
    render(<Dropdown items={items} label="Actions" disabled />);
    expect(screen.getByRole('button', { name: 'Actions' })).toBeDisabled();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" disabled />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  /* ─── Arrow navigation ─────────────────────────────────────────────────── *
   *
   * The menu clamped with `Math.min`/`Math.max` over a DOM query, so the
   * arrows stopped at both ends where `<pf-dropdown>` and `ContextMenu`
   * wrapped. Only the first test below catches that; the other two passed
   * before the fix as well, and are here because they are the behaviour the
   * rewrite could plausibly have broken.
   */

  const openMenu = async () => {
    const user = userEvent.setup();
    render(<Dropdown items={items} label="Actions" />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    return user;
  };

  const activeItem = () =>
    screen.getAllByRole('menuitem').find((item) => item.className.includes('--active'));

  it('wraps past the last item and before the first', async () => {
    const user = await openMenu();
    // Edit, Duplicate, (Delete disabled), Remove.
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveFocus();
  });

  it('skips the disabled item', async () => {
    const user = await openMenu();

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).not.toHaveFocus();
  });

  /*
   * Focus and the `--active` highlight now come off one index rather than two
   * paths that agreed by accident -- the old code moved DOM focus and relied
   * on the item's own `onFocus` to catch `activeIndex` up.
   */
  it('keeps the highlight on the focused item through Home and End', async () => {
    const user = await openMenu();

    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toHaveFocus();
    expect(activeItem()).toHaveAccessibleName('Remove');

    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    expect(activeItem()).toHaveAccessibleName('Edit');
  });
});
