import { faPaperPlane, faStar } from '@fortawesome/free-regular-svg-icons';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Icon, getAvailableIconNames, registerIcons } from './Icon';

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

  it('warns for unknown icon names', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Icon name="totally-fake-icon" aria-hidden />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('totally-fake-icon'));
    warn.mockRestore();
  });

  // Rendering nothing is indistinguishable from an invisible icon, so the
  // warning is the only signal a consumer gets -- but a component that
  // re-renders must not fill the console with the same line.
  it('warns once per unknown name, however many times it renders', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { rerender } = render(<Icon name="repeated-fake-icon" aria-hidden />);
    rerender(<Icon name="repeated-fake-icon" aria-hidden />);
    render(<Icon name="repeated-fake-icon" aria-hidden />);

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  // ─── registerIcons ───────────────────────────────────────────────────────

  it('renders nothing for a Font Awesome icon the library does not bundle', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Icon name="paper-plane" aria-hidden />);

    expect(container.firstChild).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('registerIcons'));
    warn.mockRestore();
  });

  it('renders it once the consumer registers it', () => {
    registerIcons({ 'paper-plane': faPaperPlane });

    const { container } = render(<Icon name="paper-plane" aria-hidden />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(getAvailableIconNames()).toContain('paper-plane');
  });

  // ─── Name normalization ──────────────────────────────────────────────────

  const glyph = (name: string) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Icon name={name} aria-hidden />);
    warn.mockRestore();
    const svg = container.querySelector('svg');
    return svg ? (svg.getAttribute('data-icon') ?? 'inline') : null;
  };

  it('resolves a Font Awesome alias to the icon that replaced it', () => {
    expect(glyph('bar-chart')).toBe('chart-bar');
  });

  it('resolves a camelCase spelling', () => {
    expect(glyph('chartBar')).toBe('chart-bar');
    expect(glyph('circleCheck')).toBe('circle-check');
  });

  // `legacyAliases` maps `circleInfo` to `circle-info`, a custom SVG — but the
  // custom lookup ran on the raw name only, so that mapping never took effect
  // and `circleInfo` rendered nothing.
  it('resolves a camelCase spelling of a custom icon', () => {
    expect(glyph('circleInfo')).toBe('inline');
    expect(glyph('magnifyingGlass')).toBe('inline');
  });

  it('renders the icons the docs examples use', () => {
    for (const name of ['folder-open', 'bell', 'file']) {
      expect(glyph(name), name).toBe(name);
    }
  });

  it('takes the replaced icon aliases with it', () => {
    expect(glyph('bar-chart')).toBe('chart-bar');

    registerIcons({ 'chart-bar': faStar });

    expect(glyph('chart-bar')).toBe('star');
    // Not still rendering the icon it replaced.
    expect(glyph('bar-chart')).not.toBe('chart-bar');
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
