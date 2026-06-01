import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RatingBadge, RatingStars } from './Rating';

describe('RatingStars', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders with role="img"', () => {
    render(<RatingStars value={3} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('generates a default aria-label from value and max', () => {
    render(<RatingStars value={3} max={5} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Rating 3 out of 5',
    );
  });

  it('uses a custom aria-label when provided', () => {
    render(<RatingStars value={4} ariaLabel="Product rating: 4 stars" />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Product rating: 4 stars',
    );
  });

  it('renders max number of stars', () => {
    const { container } = render(<RatingStars value={3} max={5} />);
    expect(
      container.querySelectorAll('.pf-rating-stars__star'),
    ).toHaveLength(5);
  });

  it('renders a custom max', () => {
    const { container } = render(<RatingStars value={2} max={10} />);
    expect(
      container.querySelectorAll('.pf-rating-stars__star'),
    ).toHaveLength(10);
  });

  // ─── Fill percent ────────────────────────────────────────────────────────

  it('sets 100% fill on fully filled stars', () => {
    const { container } = render(<RatingStars value={3} max={5} />);
    const stars = container.querySelectorAll<HTMLElement>('.pf-rating-stars__star');
    expect(stars[0].style.getPropertyValue('--pf-rating-fill')).toBe('100%');
    expect(stars[1].style.getPropertyValue('--pf-rating-fill')).toBe('100%');
    expect(stars[2].style.getPropertyValue('--pf-rating-fill')).toBe('100%');
  });

  it('sets 0% fill on empty stars', () => {
    const { container } = render(<RatingStars value={3} max={5} />);
    const stars = container.querySelectorAll<HTMLElement>('.pf-rating-stars__star');
    expect(stars[3].style.getPropertyValue('--pf-rating-fill')).toBe('0%');
    expect(stars[4].style.getPropertyValue('--pf-rating-fill')).toBe('0%');
  });

  it('sets partial fill for fractional values', () => {
    const { container } = render(<RatingStars value={3.5} max={5} />);
    const stars = container.querySelectorAll<HTMLElement>('.pf-rating-stars__star');
    expect(stars[3].style.getPropertyValue('--pf-rating-fill')).toBe('50%');
  });

  // ─── Clamping ────────────────────────────────────────────────────────────

  it('clamps value below 0 to 0', () => {
    render(<RatingStars value={-2} max={5} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Rating 0 out of 5',
    );
  });

  it('clamps value above max to max', () => {
    render(<RatingStars value={10} max={5} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Rating 5 out of 5',
    );
  });

  it('clamps value to max and sets all stars to 100% fill', () => {
    const { container } = render(<RatingStars value={99} max={5} />);
    const stars = container.querySelectorAll<HTMLElement>('.pf-rating-stars__star');
    stars.forEach((star) => {
      expect(star.style.getPropertyValue('--pf-rating-fill')).toBe('100%');
    });
  });

  // ─── showValue ───────────────────────────────────────────────────────────

  it('does not render value text by default', () => {
    render(<RatingStars value={3.7} />);
    expect(screen.queryByText('3.7')).not.toBeInTheDocument();
  });

  it('renders the clamped value as text when showValue=true', () => {
    render(<RatingStars value={3.7} showValue />);
    expect(screen.getByText('3.7')).toBeInTheDocument();
  });

  it('shows clamped value text when value exceeds max', () => {
    render(<RatingStars value={9} max={5} showValue />);
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });
});

describe('RatingBadge', () => {
  // ─── Value display ───────────────────────────────────────────────────────

  it('renders the clamped value formatted to one decimal', () => {
    render(<RatingBadge value={4.3} max={5} />);
    expect(screen.getByText(/4\.3/)).toBeInTheDocument();
  });

  it('renders the max value formatted to one decimal', () => {
    render(<RatingBadge value={3} max={5} />);
    expect(screen.getByText(/5\.0/)).toBeInTheDocument();
  });

  it('clamps value below 0 to 0', () => {
    render(<RatingBadge value={-1} max={5} />);
    expect(screen.getByText(/0\.0/)).toBeInTheDocument();
  });

  it('clamps value above max to max', () => {
    render(<RatingBadge value={8} max={5} />);
    expect(screen.getByText(/5\.0/)).toBeInTheDocument();
  });

  it('renders review count when reviews prop is provided', () => {
    render(<RatingBadge value={4} reviews={1200} />);
    expect(screen.getByText('(1,200)')).toBeInTheDocument();
  });

  it('does not render review count when reviews is omitted', () => {
    render(<RatingBadge value={4} />);
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it('applies the size class', () => {
    const { container } = render(<RatingBadge value={3} size="sm" />);
    expect(container.firstChild).toHaveClass('pf-rating-badge--sm');
  });

  it('defaults to md size class', () => {
    const { container } = render(<RatingBadge value={3} />);
    expect(container.firstChild).toHaveClass('pf-rating-badge--md');
  });
});
