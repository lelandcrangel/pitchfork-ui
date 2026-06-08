import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Notification, NotificationStack } from './Notification';

describe('Notification', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders with role="status"', () => {
    render(<Notification heading="Saved" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    render(<Notification heading="Upload complete" />);
    expect(screen.getByText('Upload complete')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Notification description="Your file has been saved." />);
    expect(screen.getByText('Your file has been saved.')).toBeInTheDocument();
  });

  it('renders children as the body when description is omitted', () => {
    render(<Notification>Custom body content</Notification>);
    expect(screen.getByText('Custom body content')).toBeInTheDocument();
  });

  it('applies the variant class', () => {
    render(<Notification variant="danger" heading="Error" />);
    expect(screen.getByRole('status')).toHaveClass('pf-notification--danger');
  });

  it('defaults to info variant', () => {
    render(<Notification heading="Info" />);
    expect(screen.getByRole('status')).toHaveClass('pf-notification--info');
  });

  // ─── Role per variant ────────────────────────────────────────────────────

  it('has role="status" on info variant', () => {
    render(<Notification variant="info" heading="Info" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has role="status" on success variant', () => {
    render(<Notification variant="success" heading="Done" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has role="status" on warning variant', () => {
    render(<Notification variant="warning" heading="Warning" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has role="status" on danger variant', () => {
    render(<Notification variant="danger" heading="Error" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // ─── Icon slot ───────────────────────────────────────────────────────────

  it('renders a custom icon when icon prop is provided', () => {
    render(<Notification icon={<span data-testid="custom-icon" />} heading="Note" />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('does not render the custom icon slot when icon is omitted (uses default)', () => {
    render(<Notification heading="Note" />);
    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument();
  });

  // ─── Action slot ─────────────────────────────────────────────────────────

  it('renders the action slot', () => {
    render(
      <Notification heading="Update available" action={<button type="button">Refresh</button>} />,
    );
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('does not render the action container when action is omitted', () => {
    render(<Notification heading="Note" />);
    expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
  });

  // ─── Dismiss ─────────────────────────────────────────────────────────────

  it('does not render dismiss button by default', () => {
    render(<Notification heading="Note" />);
    expect(screen.queryByRole('button', { name: 'Dismiss notification' })).not.toBeInTheDocument();
  });

  it('renders dismiss button when dismissible=true', () => {
    render(<Notification heading="Note" dismissible />);
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
  });

  it('calls onDismiss after the exit animation completes', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Notification heading="Note" dismissible onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    // The exit animation plays first (element gets the exiting class), then
    // onDismiss fires once it finishes.
    expect(screen.getByRole('status').className).toContain('pf-notification--exiting');
    expect(onDismiss).not.toHaveBeenCalled();
    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1));
  });

  // ─── Ref forwarding ──────────────────────────────────────────────────────

  it('forwards ref to the root div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Notification ref={ref} heading="Note" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(screen.getByRole('status'));
  });
});

describe('NotificationStack', () => {
  it('renders its children', () => {
    render(
      <NotificationStack>
        <Notification heading="First" />
        <Notification heading="Second" />
      </NotificationStack>,
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('applies the placement class', () => {
    const { container } = render(<NotificationStack placement="bottom-left" />);
    expect(container.firstChild).toHaveClass('pf-notification-stack--bottom-left');
  });

  it('defaults to top-right placement', () => {
    const { container } = render(<NotificationStack />);
    expect(container.firstChild).toHaveClass('pf-notification-stack--top-right');
  });
});
