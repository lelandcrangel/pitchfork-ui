import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricCard, MetricGrid } from './Metrics';

describe('MetricCard', () => {
  it('renders the heading', () => {
    render(<MetricCard heading="Revenue" value="$12,000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders the value', () => {
    render(<MetricCard heading="Revenue" value="$12,000" />);
    expect(screen.getByText('$12,000')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<MetricCard heading="Revenue" value="$12k" description="Last 30 days" />);
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });

  it('does not render description when omitted', () => {
    render(<MetricCard heading="Revenue" value="$12k" />);
    expect(screen.queryByText('Last 30 days')).not.toBeInTheDocument();
  });

  it('renders the trend label', () => {
    render(<MetricCard heading="Sales" value="200" trend="positive" trendLabel="12% up" />);
    expect(screen.getByText('12% up')).toBeInTheDocument();
  });

  it('renders the trend symbol', () => {
    const { container } = render(
      <MetricCard heading="Sales" value="200" trend="negative" trendLabel="5% down" />,
    );
    expect(container.querySelector('.pf-metric-card__trend-symbol')).toHaveTextContent('-');
  });

  it('applies the trend modifier class', () => {
    const { container } = render(
      <MetricCard heading="X" value="1" trend="positive" trendLabel="up" />,
    );
    expect(container.querySelector('.pf-metric-card__trend')).toHaveClass(
      'pf-metric-card__trend--positive',
    );
  });

  it('renders a custom icon node', () => {
    render(<MetricCard heading="Users" value="500" icon={<span data-testid="custom-icon" />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders the action slot', () => {
    render(
      <MetricCard heading="Orders" value="42" action={<button type="button">View all</button>} />,
    );
    expect(screen.getByRole('button', { name: 'View all' })).toBeInTheDocument();
  });
});

describe('MetricGrid', () => {
  it('renders children', () => {
    render(
      <MetricGrid>
        <MetricCard heading="A" value="1" />
        <MetricCard heading="B" value="2" />
      </MetricGrid>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('applies the pf-metric-grid class', () => {
    const { container } = render(<MetricGrid />);
    expect(container.firstChild).toHaveClass('pf-metric-grid');
  });
});
