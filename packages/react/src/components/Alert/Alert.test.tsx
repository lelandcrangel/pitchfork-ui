import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  // ─── Role announcement ───────────────────────────────────────────────────

  it('uses role=status for the info variant (polite)', () => {
    render(<Alert variant="info" heading="Note" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses role=status for the success variant (polite)', () => {
    render(<Alert variant="success" heading="Done" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses role=alert for the warning variant (assertive)', () => {
    render(<Alert variant="warning" heading="Watch out" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses role=alert for the danger variant (assertive)', () => {
    render(<Alert variant="danger" heading="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('defaults to role=status when no variant is provided', () => {
    render(<Alert heading="Default" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // ─── Content ─────────────────────────────────────────────────────────────

  it('renders the heading', () => {
    render(<Alert heading="Something happened" />);
    expect(screen.getByText('Something happened')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Alert description="More details here" />);
    expect(screen.getByText('More details here')).toBeInTheDocument();
  });

  it('renders children as the body when provided', () => {
    render(
      <Alert>
        <p>Custom body</p>
      </Alert>,
    );
    expect(screen.getByText('Custom body')).toBeInTheDocument();
  });

  it('prefers children over description when both are provided', () => {
    render(
      <Alert description="desc prop">
        <p>children body</p>
      </Alert>,
    );
    expect(screen.getByText('children body')).toBeInTheDocument();
    expect(screen.queryByText('desc prop')).not.toBeInTheDocument();
  });

  it('applies the variant modifier class', () => {
    render(<Alert variant="danger" heading="Error" />);
    expect(screen.getByRole('alert')).toHaveClass('pf-alert--danger');
  });

  // ─── Dismiss callback ────────────────────────────────────────────────────

  it('does not render a dismiss button by default', () => {
    render(<Alert heading="Note" />);
    expect(screen.queryByRole('button', { name: 'Dismiss alert' })).not.toBeInTheDocument();
  });

  it('renders a dismiss button when dismissible is true', () => {
    render(<Alert heading="Note" dismissible onDismiss={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Dismiss alert' })).toBeInTheDocument();
  });

  it('calls onDismiss after the exit animation when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Alert heading="Note" dismissible onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss alert' }));
    expect(screen.getByRole('status').className).toContain('pf-alert--exiting');
    await waitFor(() => expect(onDismiss).toHaveBeenCalledOnce());
  });

  it('does not throw when dismiss button clicked without onDismiss handler', async () => {
    const user = userEvent.setup();
    render(<Alert heading="Note" dismissible />);
    await expect(
      user.click(screen.getByRole('button', { name: 'Dismiss alert' })),
    ).resolves.not.toThrow();
  });

  // ─── Custom icon ─────────────────────────────────────────────────────────

  it('renders a custom icon when icon prop is provided', () => {
    render(<Alert heading="Note" icon={<span data-testid="custom-icon" />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  // ─── Consumer overrides ──────────────────────────────────────────────────

  it('allows consumers to override the role via props', () => {
    render(<Alert heading="Note" role="log" />);
    expect(screen.getByRole('log')).toBeInTheDocument();
  });

  it('merges additional className with the variant class', () => {
    render(<Alert variant="info" heading="Note" className="my-alert" />);
    const el = screen.getByRole('status');
    expect(el).toHaveClass('pf-alert--info');
    expect(el).toHaveClass('my-alert');
  });
});
