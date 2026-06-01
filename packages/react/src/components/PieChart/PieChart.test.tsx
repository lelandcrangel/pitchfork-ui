import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PieChart, type PieChartDatum } from './PieChart';

const data: PieChartDatum[] = [
  { label: 'Apples', value: 40 },
  { label: 'Oranges', value: 30 },
  { label: 'Bananas', value: 30 },
];

describe('PieChart', () => {
  it('renders with role="img"', () => {
    render(<PieChart data={data} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('renders the empty state when data is empty', () => {
    render(<PieChart data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders a custom empty label', () => {
    render(<PieChart data={[]} emptyLabel="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders all segment labels in the legend', () => {
    render(<PieChart data={data} />);
    expect(screen.getByText('Apples')).toBeInTheDocument();
    expect(screen.getByText('Oranges')).toBeInTheDocument();
    expect(screen.getByText('Bananas')).toBeInTheDocument();
  });

  it('renders percentage values in the legend', () => {
    render(<PieChart data={data} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('hides the legend when showLegend=false', () => {
    render(<PieChart data={data} showLegend={false} />);
    expect(screen.queryByText('Apples')).not.toBeInTheDocument();
  });

  it('renders the center label when provided', () => {
    render(<PieChart data={data} centerLabel="Total" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders a conic-gradient on the visual element', () => {
    const { container } = render(<PieChart data={data} />);
    const visual = container.querySelector('.pf-pie-chart__visual');
    expect(visual).toHaveStyle({ backgroundImage: expect.stringContaining('conic-gradient') });
  });

  it('applies empty class when data is empty', () => {
    const { container } = render(<PieChart data={[]} />);
    expect(container.querySelector('.pf-pie-chart__visual--empty')).toBeInTheDocument();
  });
});
