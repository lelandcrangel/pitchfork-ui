import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

beforeEach(() => {
  // getFocusableElements filters on offsetParent !== null, which is always null
  // in jsdom because it has no layout engine. Mock it so focus trap works.
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
});

afterEach(() => {
  document.body.style.overflow = '';
  vi.restoreAllMocks();
});

// Controlled wrapper for open/close interaction tests
function ControlledModal(props: Partial<React.ComponentProps<typeof Modal>>) {
  const [open, setOpen] = useState(props.open ?? false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open modal</button>
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
        title={props.title ?? 'Test modal'}
        {...props}
      >
        {props.children ?? 'Modal content'}
      </Modal>
    </div>
  );
}

describe('Modal', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders nothing when open is false', () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog when open is true', () => {
    render(
      <Modal open title="My modal" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('renders the title and description', () => {
    render(
      <Modal open title="Confirm action" description="This cannot be undone" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    expect(screen.getByText('Confirm action')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone')).toBeInTheDocument();
  });

  it('sets aria-labelledby pointing to the title element', () => {
    render(
      <Modal open title="Labelled modal" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const titleId = screen.getByText('Labelled modal').id;
    expect(dialog).toHaveAttribute('aria-labelledby', titleId);
  });

  it('sets aria-describedby pointing to the description element', () => {
    render(
      <Modal open title="T" description="Described modal" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const descId = screen.getByText('Described modal').id;
    expect(dialog).toHaveAttribute('aria-describedby', descId);
  });

  it('renders children inside the modal body', () => {
    render(
      <Modal open title="T" onOpenChange={vi.fn()}>
        <p>Body text</p>
      </Modal>,
    );
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('renders the footer when provided', () => {
    render(
      <Modal open title="T" onOpenChange={vi.fn()} footer={<button>Confirm</button>}>
        Content
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('shows the close button by default', () => {
    render(
      <Modal open title="T" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeInTheDocument();
  });

  it('hides the close button when showCloseButton is false', () => {
    render(
      <Modal open title="T" onOpenChange={vi.fn()} showCloseButton={false}>
        Content
      </Modal>,
    );
    expect(screen.queryByRole('button', { name: 'Close modal' })).not.toBeInTheDocument();
  });

  it('applies the size modifier class', () => {
    render(
      <Modal open title="T" onOpenChange={vi.fn()} size="lg">
        Content
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('pf-modal--lg');
  });

  // ─── Close behaviors ─────────────────────────────────────────────────────

  it('calls onOpenChange(false) when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="T" onOpenChange={onOpenChange}>
        Content
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) on Escape key', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="T" onOpenChange={onOpenChange}>
        Content
      </Modal>,
    );
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when the overlay is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="T" onOpenChange={onOpenChange} closeOnOverlayClick>
        Content
      </Modal>,
    );
    const overlay = document.querySelector('.pf-modal__overlay') as HTMLElement;
    await user.click(overlay);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not call onOpenChange when overlay is clicked and closeOnOverlayClick is false', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="T" onOpenChange={onOpenChange} closeOnOverlayClick={false}>
        Content
      </Modal>,
    );
    const overlay = document.querySelector('.pf-modal__overlay') as HTMLElement;
    await user.click(overlay);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // ─── Scroll lock ─────────────────────────────────────────────────────────

  it('sets body overflow to hidden when open', () => {
    render(
      <Modal open title="T" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow after the modal closes and finishes exiting', async () => {
    const { rerender } = render(
      <Modal open title="T" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal open={false} title="T" onOpenChange={vi.fn()}>
        Content
      </Modal>,
    );
    // Scroll stays locked through the exit animation, then is restored on unmount.
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
  });

  // ─── Focus management ────────────────────────────────────────────────────

  it('moves focus into the modal when it opens', async () => {
    const user = userEvent.setup();
    render(<ControlledModal />);
    await user.click(screen.getByRole('button', { name: 'Open modal' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('restores focus to the trigger element when the modal closes', async () => {
    const user = userEvent.setup();
    render(<ControlledModal />);
    const openButton = screen.getByRole('button', { name: 'Open modal' });
    await user.click(openButton);
    await user.keyboard('{Escape}');
    expect(openButton).toHaveFocus();
  });

  it('wraps Tab from the last focusable element back to the first', async () => {
    const user = userEvent.setup();
    render(
      <Modal open title="T" onOpenChange={vi.fn()} footer={<button>Confirm</button>}>
        <button>Action</button>
      </Modal>,
    );
    // Focusable order: Close modal → Action → Confirm
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    confirm.focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close modal' })).toHaveFocus();
  });

  it('wraps Shift+Tab from the first focusable element back to the last', async () => {
    const user = userEvent.setup();
    render(
      <Modal open title="T" onOpenChange={vi.fn()} footer={<button>Confirm</button>}>
        <button>Action</button>
      </Modal>,
    );
    // First focusable = Close modal button
    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    closeButton.focus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
  });
});
