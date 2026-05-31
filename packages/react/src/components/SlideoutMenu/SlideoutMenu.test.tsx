import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SlideoutMenu } from './SlideoutMenu';

// SlideoutMenu uses a 16ms enter-animation timer and a 220ms unmount timer.
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  document.body.style.overflow = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/** Render open and flush both animation timers so the panel is fully visible. */
function renderOpen(props: Partial<React.ComponentProps<typeof SlideoutMenu>> = {}) {
  const result = render(
    <SlideoutMenu open title="Test panel" onOpenChange={vi.fn()} {...props}>
      {props.children ?? 'Panel content'}
    </SlideoutMenu>,
  );
  act(() => vi.runAllTimers());
  return result;
}

describe('SlideoutMenu', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders nothing when open is false', () => {
    render(<SlideoutMenu open={false} onOpenChange={vi.fn()}>Content</SlideoutMenu>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog when open is true', () => {
    renderOpen();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('renders the title and description', () => {
    renderOpen({ title: 'Settings', description: 'Adjust your preferences' });
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Adjust your preferences')).toBeInTheDocument();
  });

  it('sets aria-labelledby pointing to the title', () => {
    renderOpen({ title: 'Settings' });
    const dialog = screen.getByRole('dialog');
    const titleId = screen.getByText('Settings').id;
    expect(dialog).toHaveAttribute('aria-labelledby', titleId);
  });

  it('sets aria-describedby pointing to the description', () => {
    renderOpen({ title: 'T', description: 'Described' });
    const dialog = screen.getByRole('dialog');
    const descId = screen.getByText('Described').id;
    expect(dialog).toHaveAttribute('aria-describedby', descId);
  });

  it('renders children inside the panel body', () => {
    renderOpen({ children: <p>Body text</p> });
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('renders the footer when provided', () => {
    renderOpen({ footer: <button>Save</button> });
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows the close button by default', () => {
    renderOpen();
    expect(screen.getByRole('button', { name: 'Close slideout' })).toBeInTheDocument();
  });

  it('hides the close button when showCloseButton is false', () => {
    renderOpen({ showCloseButton: false });
    expect(screen.queryByRole('button', { name: 'Close slideout' })).not.toBeInTheDocument();
  });

  it('applies the placement class', () => {
    renderOpen({ placement: 'left' });
    expect(document.querySelector('.pf-slideout__viewport--left')).toBeInTheDocument();
  });

  it('applies the size class', () => {
    renderOpen({ size: 'lg' });
    expect(screen.getByRole('dialog')).toHaveClass('pf-slideout--lg');
  });

  // ─── Close behaviours ────────────────────────────────────────────────────

  it('calls onOpenChange(false) when the close button is clicked', () => {
    const onOpenChange = vi.fn();
    renderOpen({ onOpenChange });
    fireEvent.click(screen.getByRole('button', { name: 'Close slideout' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) on Escape key', () => {
    const onOpenChange = vi.fn();
    renderOpen({ onOpenChange });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when the overlay is clicked', () => {
    const onOpenChange = vi.fn();
    renderOpen({ onOpenChange, closeOnOverlayClick: true });
    fireEvent.click(document.querySelector('.pf-slideout__overlay') as HTMLElement);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not call onOpenChange when overlay clicked and closeOnOverlayClick is false', () => {
    const onOpenChange = vi.fn();
    renderOpen({ onOpenChange, closeOnOverlayClick: false });
    fireEvent.click(document.querySelector('.pf-slideout__overlay') as HTMLElement);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // ─── Scroll lock ─────────────────────────────────────────────────────────

  it('sets body overflow to hidden when open', () => {
    renderOpen();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    const { rerender } = renderOpen();
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<SlideoutMenu open={false} onOpenChange={vi.fn()}>Content</SlideoutMenu>);
    act(() => vi.runAllTimers());
    expect(document.body.style.overflow).toBe('');
  });

  // ─── Focus management ────────────────────────────────────────────────────

  it('moves focus into the panel when it opens', () => {
    renderOpen();
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('restores focus to the previously focused element when the panel closes', () => {
    const { rerender } = render(
      <div>
        <button id="trigger">Open</button>
        <SlideoutMenu open={false} onOpenChange={vi.fn()} title="Panel">Content</SlideoutMenu>
      </div>,
    );
    const trigger = document.getElementById('trigger') as HTMLElement;
    trigger.focus();

    rerender(
      <div>
        <button id="trigger">Open</button>
        <SlideoutMenu open title="Panel" onOpenChange={vi.fn()}>Content</SlideoutMenu>
      </div>,
    );
    act(() => vi.runAllTimers());
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);

    rerender(
      <div>
        <button id="trigger">Open</button>
        <SlideoutMenu open={false} title="Panel" onOpenChange={vi.fn()}>Content</SlideoutMenu>
      </div>,
    );
    act(() => vi.runAllTimers());
    expect(trigger).toHaveFocus();
  });
});
