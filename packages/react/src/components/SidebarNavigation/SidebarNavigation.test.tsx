import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarNavigation, type SidebarNavigationSection } from './SidebarNavigation';

const sections: SidebarNavigationSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', active: true },
      { label: 'Settings', href: '/settings' },
    ],
  },
  {
    items: [{ label: 'Help', href: '/help' }],
  },
];

describe('SidebarNavigation', () => {
  it('renders a nav landmark', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByRole('navigation', { name: 'Sidebar navigation' })).toBeInTheDocument();
  });

  it('renders all item labels', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders section titles', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('renders links for items with href', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('href', '/dashboard');
  });

  it('marks the active item with aria-current="page"', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on inactive items', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByRole('link', { name: /Settings/ })).not.toHaveAttribute('aria-current');
  });

  it('renders a button for items with onClick but no href', () => {
    const onClick = vi.fn();
    render(<SidebarNavigation sections={[{ items: [{ label: 'Action', onClick }] }]} />);
    expect(screen.getByRole('button', { name: /Action/ })).toBeInTheDocument();
  });

  it('disables a button item when disabled=true', () => {
    render(
      <SidebarNavigation
        sections={[{ items: [{ label: 'Locked', onClick: vi.fn(), disabled: true }] }]}
      />,
    );
    expect(screen.getByRole('button', { name: /Locked/ })).toBeDisabled();
  });

  it('renders the header slot', () => {
    render(<SidebarNavigation sections={[]} header={<span data-testid="sidebar-header" />} />);
    expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
  });

  it('renders the footer slot', () => {
    render(<SidebarNavigation sections={[]} footer={<span data-testid="sidebar-footer" />} />);
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
  });
});

/*
 * The resolution runs across sections, not within one: `aria-current="page"`
 * names the one page the reader is on. Core's `resolveCurrentNavItem` is
 * shared with `<pf-sidebar-navigation>` so both mark the same item, and the
 * highlight follows the announcement — a second highlighted row with no
 * `aria-current` would be a sighted-only lie.
 */
describe('SidebarNavigation with two active items', () => {
  const sections: SidebarNavigationSection[] = [
    { title: 'Main', items: [{ label: 'Home', href: '/', active: true }] },
    { title: 'Admin', items: [{ label: 'Users', href: '/users', active: true }] },
  ];

  it('marks only the first across every section', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Users' })).not.toHaveAttribute('aria-current');
  });

  it('highlights only the item it announces', () => {
    render(<SidebarNavigation sections={sections} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass(
      'pf-sidebar-navigation__link--active',
    );
    expect(screen.getByRole('link', { name: 'Users' })).not.toHaveClass(
      'pf-sidebar-navigation__link--active',
    );
  });

  /* One item object reused in two sections must not mark both. */
  it('counts items rather than comparing them', () => {
    const shared = { label: 'Shared', href: '/shared', active: true };
    render(
      <SidebarNavigation
        sections={[{ items: [shared] }, { items: [{ ...shared, label: 'Second' }] }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Shared' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Second' })).not.toHaveAttribute('aria-current');
  });
});
