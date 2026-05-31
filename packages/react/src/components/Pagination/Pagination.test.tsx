import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a nav landmark with the default aria-label', () => {
    render(<Pagination totalPages={5} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('renders prev and next buttons by default', () => {
    render(<Pagination totalPages={5} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('hides prev/next buttons when showPrevNext is false', () => {
    render(<Pagination totalPages={5} showPrevNext={false} />);
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('renders page buttons for each page', () => {
    render(<Pagination totalPages={3} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current=page', () => {
    render(<Pagination totalPages={5} defaultPage={2} />);
    expect(screen.getByRole('button', { name: '2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveAttribute('aria-current');
  });

  it('accepts a custom aria-label', () => {
    render(<Pagination totalPages={5} aria-label="Results pages" />);
    expect(screen.getByRole('navigation', { name: 'Results pages' })).toBeInTheDocument();
  });

  // ─── Disabled at boundaries ──────────────────────────────────────────────

  it('disables the Previous button on the first page', () => {
    render(<Pagination totalPages={5} defaultPage={1} />);
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('disables the Next button on the last page', () => {
    render(<Pagination totalPages={5} defaultPage={5} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('enables both nav buttons on a middle page', () => {
    render(<Pagination totalPages={5} defaultPage={3} />);
    expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  // ─── Page changes ────────────────────────────────────────────────────────

  it('calls onPageChange with the next page when Next is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination totalPages={5} defaultPage={2} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with the previous page when Previous is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination totalPages={5} defaultPage={3} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when a page number button is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination totalPages={3} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('updates the active page in uncontrolled mode', async () => {
    const user = userEvent.setup();
    // totalPages=3 keeps all pages visible (no ellipsis)
    render(<Pagination totalPages={3} defaultPage={1} />);
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  it('reflects the controlled page value', () => {
    render(<Pagination totalPages={5} page={4} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '4' })).toHaveAttribute('aria-current', 'page');
  });

  it('advances page with Next in uncontrolled mode', async () => {
    const user = userEvent.setup();
    render(<Pagination totalPages={5} defaultPage={2} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: '3' })).toHaveAttribute('aria-current', 'page');
  });

  // ─── Disabled state ──────────────────────────────────────────────────────

  it('disables all buttons when disabled prop is set', () => {
    render(<Pagination totalPages={5} defaultPage={3} disabled />);
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled());
  });

  it('does not call onPageChange when disabled', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination totalPages={5} defaultPage={3} disabled onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  // ─── Custom labels ───────────────────────────────────────────────────────

  it('renders custom prev/next labels', () => {
    render(<Pagination totalPages={5} prevLabel="← Back" nextLabel="Forward →" />);
    expect(screen.getByRole('button', { name: '← Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forward →' })).toBeInTheDocument();
  });
});
