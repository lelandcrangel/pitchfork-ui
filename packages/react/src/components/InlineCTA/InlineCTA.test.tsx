import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InlineCTA } from './InlineCTA';

describe('InlineCTA', () => {
  it('renders the heading', () => {
    render(<InlineCTA heading="Need help?" />);
    expect(screen.getByText('Need help?')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<InlineCTA description="Contact our support team." />);
    expect(screen.getByText('Contact our support team.')).toBeInTheDocument();
  });

  it('renders the action slot', () => {
    render(<InlineCTA action={<button type="button">Get started</button>} />);
    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument();
  });

  it('does not render action when omitted', () => {
    render(<InlineCTA heading="Hi" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a custom icon', () => {
    render(<InlineCTA icon={<span data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies the tone class', () => {
    const { container } = render(<InlineCTA tone="warning" />);
    expect(container.firstChild).toHaveClass('pf-inline-cta--warning');
  });

  it('defaults to default tone', () => {
    const { container } = render(<InlineCTA />);
    expect(container.firstChild).toHaveClass('pf-inline-cta--default');
  });

  it('renders children as body content', () => {
    render(<InlineCTA>Custom content here</InlineCTA>);
    expect(screen.getByText('Custom content here')).toBeInTheDocument();
  });
});
