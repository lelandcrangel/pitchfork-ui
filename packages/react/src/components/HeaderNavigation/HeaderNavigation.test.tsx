import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HeaderNavigation, type HeaderNavigationItem } from './HeaderNavigation';

const items: HeaderNavigationItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact', active: true },
];

describe('HeaderNavigation', () => {
  it('renders a nav landmark', () => {
    render(<HeaderNavigation items={items} />);
    expect(
      screen.getByRole('navigation', { name: 'Header navigation' }),
    ).toBeInTheDocument();
  });

  it('renders all nav link labels', () => {
    render(<HeaderNavigation items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('renders links for items with href', () => {
    render(<HeaderNavigation items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  it('marks the active item with aria-current="page"', () => {
    render(<HeaderNavigation items={items} />);
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on inactive items', () => {
    render(<HeaderNavigation items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('renders a button for items with onClick but no href', () => {
    const onClick = vi.fn();
    render(
      <HeaderNavigation
        items={[{ label: 'Action', onClick }]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('renders a span for items with no href and no onClick', () => {
    render(<HeaderNavigation items={[{ label: 'Static' }]} />);
    expect(screen.getByText('Static').tagName).toBe('SPAN');
  });

  it('renders the brand slot', () => {
    render(
      <HeaderNavigation
        items={[]}
        brand={<span data-testid="logo" />}
      />,
    );
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('renders the actions slot', () => {
    render(
      <HeaderNavigation
        items={[]}
        actions={<button type="button">Sign in</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
