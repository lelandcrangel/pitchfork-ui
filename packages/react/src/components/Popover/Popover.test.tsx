import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Popover } from './Popover';

const renderPopover = (props?: Partial<React.ComponentProps<typeof Popover>>) =>
  render(
    <Popover trigger={<button type="button">Open</button>} label="Details" {...props}>
      <p>Popover content</p>
    </Popover>,
  );

describe('Popover', () => {
  it('renders the trigger', () => {
    renderPopover();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('is closed by default', () => {
    renderPopover();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on trigger click and exposes a labelled dialog', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByText('Popover content')).toBeInTheDocument();
  });

  it('toggles aria-expanded on the trigger', async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Open' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes on outside click', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('does not close on outside click when closeOnOutsideClick is false', async () => {
    const user = userEvent.setup();
    renderPopover({ closeOnOutsideClick: false });
    await user.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderPopover({ onOpenChange });
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('supports controlled open', () => {
    renderPopover({ open: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
