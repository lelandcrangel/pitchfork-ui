import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingDots, LoadingSkeleton, LoadingSpinner } from './LoadingIndicators';

describe('LoadingSpinner', () => {
  it('renders with role="status"', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has default aria-label "Loading"', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('uses a custom label', () => {
    render(<LoadingSpinner label="Saving changes" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Saving changes');
  });

  it('renders the label as screen-reader text', () => {
    render(<LoadingSpinner label="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('applies the size via CSS variable', () => {
    render(<LoadingSpinner size={48} />);
    const el = screen.getByRole('status');
    expect(el.style.getPropertyValue('--pf-spinner-size')).toBe('48px');
  });

  it('defaults to 24px via CSS variable', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status').style.getPropertyValue('--pf-spinner-size')).toBe('24px');
  });
});

describe('LoadingDots', () => {
  it('renders with role="status"', () => {
    render(<LoadingDots />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has default aria-label "Loading"', () => {
    render(<LoadingDots />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading');
  });

  it('uses a custom label', () => {
    render(<LoadingDots label="Uploading" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Uploading');
  });

  it('renders three dot elements', () => {
    const { container } = render(<LoadingDots />);
    expect(container.querySelectorAll('.pf-loading-dots__dot')).toHaveLength(3);
  });

  it('applies the size class', () => {
    render(<LoadingDots size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('pf-loading-dots--lg');
  });

  it('defaults to md size class', () => {
    render(<LoadingDots />);
    expect(screen.getByRole('status')).toHaveClass('pf-loading-dots--md');
  });
});

describe('LoadingSkeleton', () => {
  it('renders with role="status"', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has default aria-label "Loading content"', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
  });

  it('uses a custom label', () => {
    render(<LoadingSkeleton label="Loading profile" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading profile');
  });

  it('applies width and height via CSS variables', () => {
    render(<LoadingSkeleton width={200} height={32} />);
    const el = screen.getByRole('status');
    expect(el.style.getPropertyValue('--pf-skeleton-width')).toBe('200px');
    expect(el.style.getPropertyValue('--pf-skeleton-height')).toBe('32px');
  });

  it('accepts string width values', () => {
    render(<LoadingSkeleton width="50%" height="1rem" />);
    const el = screen.getByRole('status');
    expect(el.style.getPropertyValue('--pf-skeleton-width')).toBe('50%');
    expect(el.style.getPropertyValue('--pf-skeleton-height')).toBe('1rem');
  });

  it('defaults to 100% width and 16px height via CSS variables', () => {
    render(<LoadingSkeleton />);
    const el = screen.getByRole('status');
    expect(el.style.getPropertyValue('--pf-skeleton-width')).toBe('100%');
    expect(el.style.getPropertyValue('--pf-skeleton-height')).toBe('16px');
  });

  it('applies the rounded modifier class when rounded=true', () => {
    render(<LoadingSkeleton rounded />);
    expect(screen.getByRole('status')).toHaveClass('pf-loading-skeleton--rounded');
  });

  it('does not apply rounded class by default', () => {
    render(<LoadingSkeleton />);
    expect(screen.getByRole('status')).not.toHaveClass('pf-loading-skeleton--rounded');
  });
});
