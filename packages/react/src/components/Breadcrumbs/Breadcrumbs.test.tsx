import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

const items: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Shoes' },
];

describe('Breadcrumbs', () => {
  it('renders a nav landmark', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('renders all item labels', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Shoes')).toBeInTheDocument();
  });

  it('renders links for items with href', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
  });

  it('renders a span (not a link) for items without href', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.queryByRole('link', { name: 'Shoes' })).not.toBeInTheDocument();
    expect(screen.getByText('Shoes').tagName).toBe('SPAN');
  });

  it('sets aria-current="page" on the last item', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Shoes')).toHaveAttribute('aria-current', 'page');
  });

  it('does not set aria-current on non-last items', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Products' })).not.toHaveAttribute('aria-current');
  });

  it('respects explicit current=true on a non-last item', () => {
    const custom: BreadcrumbItem[] = [
      { label: 'Home', href: '/', current: true },
      { label: 'Products', href: '/products' },
    ];
    render(<Breadcrumbs items={custom} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
  });

  /*
   * `aria-current="page"` identifies one page. Reading `item.current ?? isLast`
   * per item marked both the explicitly-current crumb and the last one, so a
   * screen reader was told the user was on two pages at once. Core's
   * `resolveCurrentCrumb` picks one index, which is what this pins.
   */
  it('marks exactly one crumb, even when a non-last one is current', () => {
    const custom: BreadcrumbItem[] = [
      { label: 'Home', href: '/', current: true },
      { label: 'Products', href: '/products' },
      { label: 'Shoes' },
    ];
    const { container } = render(<Breadcrumbs items={custom} />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Shoes')).not.toHaveAttribute('aria-current');
  });

  it('marks nothing current in an empty trail', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(0);
  });

  it('renders the default separator between items', () => {
    const { container } = render(<Breadcrumbs items={items} />);
    const separators = container.querySelectorAll('.pf-breadcrumbs__separator');
    expect(separators).toHaveLength(items.length - 1);
    expect(separators[0]).toHaveTextContent('/');
  });

  it('renders a custom separator', () => {
    const { container } = render(<Breadcrumbs items={items} separator=">" />);
    const separators = container.querySelectorAll('.pf-breadcrumbs__separator');
    expect(separators[0]).toHaveTextContent('>');
  });

  it('uses a custom aria-label', () => {
    render(<Breadcrumbs items={items} aria-label="Site breadcrumb" />);
    expect(screen.getByRole('navigation', { name: 'Site breadcrumb' })).toBeInTheDocument();
  });
});
