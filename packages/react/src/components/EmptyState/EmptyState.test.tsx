import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders heading text', () => {
    render(<EmptyState heading="No results found" />);
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState heading="No results" description="Try adjusting your search" />);
    expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
  });

  it('omits description element when not provided', () => {
    const { container } = render(<EmptyState heading="No results" />);
    expect(container.querySelector('.pf-empty-state__description')).toBeNull();
  });

  it('renders action when provided', () => {
    render(<EmptyState heading="No results" action={<button>Reset filters</button>} />);
    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();
  });

  it('hides icon container from assistive technology', () => {
    const { container } = render(<EmptyState heading="No results" iconName="circle-check" />);
    expect(container.querySelector('.pf-empty-state__icon')).toHaveAttribute('aria-hidden');
  });

  it('applies md size class by default', () => {
    const { container } = render(<EmptyState heading="No results" />);
    expect(container.firstChild).toHaveClass('pf-empty-state--md');
  });

  it('applies the specified size class', () => {
    const { container } = render(<EmptyState heading="No results" size="lg" />);
    expect(container.firstChild).toHaveClass('pf-empty-state--lg');
  });

  it('forwards extra props to the root element', () => {
    render(<EmptyState heading="No results" data-testid="empty-state" />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});
