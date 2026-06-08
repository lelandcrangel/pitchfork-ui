import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  it('renders a trigger button wired to the content region', () => {
    render(
      <Collapsible trigger="Details">
        <p>Hidden content</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const region = screen.getByRole('region', { hidden: true });
    expect(trigger).toHaveAttribute('aria-controls', region.id);
  });

  it('is collapsed (inert) by default and expands on click', () => {
    render(
      <Collapsible trigger="Details">
        <p>Body</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(screen.getByRole('region', { hidden: true })).toHaveAttribute('inert');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region')).not.toHaveAttribute('inert');
  });

  it('respects defaultOpen', () => {
    render(
      <Collapsible trigger="Details" defaultOpen>
        <p>Body</p>
      </Collapsible>,
    );
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('fires onOpenChange when toggled', () => {
    const onOpenChange = vi.fn();
    render(
      <Collapsible trigger="Details" onOpenChange={onOpenChange}>
        <p>Body</p>
      </Collapsible>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('supports controlled mode', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Collapsible trigger="Details" open={false} onOpenChange={onOpenChange}>
        <p>Body</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(trigger);
    // Controlled: stays closed until parent updates the prop.
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    rerender(
      <Collapsible trigger="Details" open onOpenChange={onOpenChange}>
        <p>Body</p>
      </Collapsible>,
    );
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not toggle when disabled', () => {
    const onOpenChange = vi.fn();
    render(
      <Collapsible trigger="Details" disabled onOpenChange={onOpenChange}>
        <p>Body</p>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Details' });
    expect(trigger).toBeDisabled();
    fireEvent.click(trigger);
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
