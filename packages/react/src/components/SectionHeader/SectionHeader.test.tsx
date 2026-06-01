import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders the heading as an h2', () => {
    render(<SectionHeader heading="Team members" />);
    expect(screen.getByRole('heading', { name: 'Team members', level: 2 })).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<SectionHeader heading="Team" description="Manage your team." />);
    expect(screen.getByText('Manage your team.')).toBeInTheDocument();
  });

  it('renders the eyebrow text', () => {
    render(<SectionHeader heading="Team" eyebrow="Section" />);
    expect(screen.getByText('Section')).toBeInTheDocument();
  });

  it('renders the actions slot', () => {
    render(
      <SectionHeader
        heading="Team"
        actions={<button type="button">Add member</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add member' })).toBeInTheDocument();
  });

  it('applies the divider class when divider=true', () => {
    const { container } = render(<SectionHeader heading="X" divider />);
    expect(container.firstChild).toHaveClass('pf-section-header--divider');
  });

  it('applies the align class', () => {
    const { container } = render(<SectionHeader heading="X" align="end" />);
    expect(container.firstChild).toHaveClass('pf-section-header--end');
  });
});
