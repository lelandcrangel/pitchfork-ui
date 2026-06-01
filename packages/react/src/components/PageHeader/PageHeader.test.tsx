import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the heading as an h1', () => {
    render(<PageHeader heading="Dashboard" />);
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<PageHeader heading="Dashboard" description="Overview of your data." />);
    expect(screen.getByText('Overview of your data.')).toBeInTheDocument();
  });

  it('renders the eyebrow text', () => {
    render(<PageHeader heading="Dashboard" eyebrow="Admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders the actions slot', () => {
    render(
      <PageHeader
        heading="Dashboard"
        actions={<button type="button">Export</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    render(
      <PageHeader
        heading="Dashboard"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Dashboard' },
        ]}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('does not render breadcrumbs when array is empty', () => {
    render(<PageHeader heading="Dashboard" breadcrumbs={[]} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders as a header element', () => {
    render(<PageHeader heading="Dashboard" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
