import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Icon, getAvailableIconNames } from './Icon';

describe('Icon', () => {
  // ─── Known FA icon names ─────────────────────────────────────────────────

  it('renders a span container for known icons', () => {
    const { container } = render(<Icon name="star" aria-hidden />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with aria-label when label prop is provided', () => {
    render(<Icon name="star" label="Starred" />);
    expect(screen.getByLabelText('Starred')).toBeInTheDocument();
  });

  // ─── Custom icons ────────────────────────────────────────────────────────

  it('renders custom icons (triangle-exclamation)', () => {
    const { container } = render(<Icon name="triangle-exclamation" aria-hidden />);
    expect(container.querySelector('.pf-icon')).toBeInTheDocument();
  });

  it('renders custom icons (chevron-down)', () => {
    const { container } = render(<Icon name="chevron-down" aria-hidden />);
    expect(container.querySelector('.pf-icon')).toBeInTheDocument();
  });

  // ─── Unknown icon ─────────────────────────────────────────────────────────

  it('returns null for unknown icon names', () => {
    const { container } = render(<Icon name="not-a-real-icon-xyz" aria-hidden />);
    expect(container.firstChild).toBeNull();
  });

  it('logs a dev warning for unknown icon names', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Icon name="totally-fake-icon" aria-hidden />);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('totally-fake-icon'),
    );
    warn.mockRestore();
  });

  // ─── getAvailableIconNames ───────────────────────────────────────────────

  it('getAvailableIconNames returns a non-empty array', () => {
    const names = getAvailableIconNames();
    expect(names.length).toBeGreaterThan(0);
  });

  it('getAvailableIconNames includes known custom icon names', () => {
    const names = getAvailableIconNames();
    expect(names).toContain('triangle-exclamation');
  });
});
