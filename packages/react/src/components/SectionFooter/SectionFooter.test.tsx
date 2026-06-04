import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionFooter } from './SectionFooter';

describe('SectionFooter', () => {
  it('renders children', () => {
    render(<SectionFooter>Footer content</SectionFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders as a footer element', () => {
    render(<SectionFooter>x</SectionFooter>);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders heading when provided', () => {
    render(<SectionFooter heading="Summary" />);
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<SectionFooter description="Read the docs." />);
    expect(screen.getByText('Read the docs.')).toBeInTheDocument();
  });

  it('renders the actions slot', () => {
    render(<SectionFooter actions={<button type="button">Save</button>} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('applies divider class by default', () => {
    const { container } = render(<SectionFooter />);
    expect(container.firstChild).toHaveClass('pf-section-footer--divider');
  });

  it('omits divider class when divider=false', () => {
    const { container } = render(<SectionFooter divider={false} />);
    expect(container.firstChild).not.toHaveClass('pf-section-footer--divider');
  });
});
