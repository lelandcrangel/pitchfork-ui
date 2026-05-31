import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders with role=switch', () => {
    render(<Switch />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('associates the label with the switch via htmlFor', () => {
    render(<Switch label="Dark mode" />);
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument();
    const label = screen.getByText('Dark mode');
    expect(label).toHaveAttribute('for', screen.getByRole('switch').id);
  });

  it('renders without a label element when label prop is omitted', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch', { name: 'Toggle' })).toBeInTheDocument();
    expect(screen.queryByRole('label')).not.toBeInTheDocument();
  });

  // ─── Toggle state ────────────────────────────────────────────────────────

  it('is off (unchecked) by default', () => {
    render(<Switch label="Notifications" />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('is on when defaultChecked is true (uncontrolled)', () => {
    render(<Switch label="Notifications" defaultChecked />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('reflects the controlled checked state', () => {
    render(<Switch label="Notifications" checked onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Notifications" onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('toggles from off to on in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);
    const sw = screen.getByRole('switch');
    expect(sw).not.toBeChecked();
    await user.click(sw);
    expect(sw).toBeChecked();
  });

  it('toggles back to off after a second click', async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);
    const sw = screen.getByRole('switch');
    await user.click(sw);
    await user.click(sw);
    expect(sw).not.toBeChecked();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('is disabled when the disabled prop is set', () => {
    render(<Switch label="Notifications" disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch label="Notifications" disabled onChange={onChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).not.toHaveBeenCalled();
  });

  // ─── Other native props ──────────────────────────────────────────────────

  it('sets the required attribute', () => {
    render(<Switch label="Agree" required />);
    expect(screen.getByRole('switch')).toBeRequired();
  });

  it('forwards the ref to the native input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Switch ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
