import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarChart, LineChart, type ChartDataPoint, type ChartSeries } from './LineBarChart';

const data: ChartDataPoint[] = [
  { label: 'Jan', revenue: 100, cost: 60 },
  { label: 'Feb', revenue: 150, cost: 80 },
  { label: 'Mar', revenue: 120, cost: 70 },
];

const series: ChartSeries[] = [
  { key: 'revenue', label: 'Revenue', color: '#3b82f6' },
  { key: 'cost', label: 'Cost', color: '#ef4444' },
];

describe('LineChart', () => {
  it('renders with role="img"', () => {
    render(<LineChart data={data} series={series} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('shows "No data" when data is empty', () => {
    render(<LineChart data={[]} series={series} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('shows "No data" when series is empty', () => {
    render(<LineChart data={data} series={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders x-axis labels', () => {
    render(<LineChart data={data} series={series} />);
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('renders a dot with title for each data point per series', () => {
    const { container } = render(<LineChart data={data} series={[series[0]]} />);
    const titles = container.querySelectorAll('circle title');
    expect(titles).toHaveLength(data.length);
  });

  it('renders the legend when there are multiple series', () => {
    render(<LineChart data={data} series={series} showLegend />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('hides the legend when showLegend=false', () => {
    const { container } = render(<LineChart data={data} series={series} showLegend={false} />);
    expect(container.querySelector('.pf-chart-legend')).not.toBeInTheDocument();
  });

  it('uses yAxisLabel as aria-label when provided', () => {
    render(<LineChart data={data} series={series} yAxisLabel="Monthly revenue" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Monthly revenue');
  });
});

describe('BarChart', () => {
  it('renders with role="img"', () => {
    render(<BarChart data={data} series={series} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('shows "No data" when data is empty', () => {
    render(<BarChart data={[]} series={series} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders bar elements', () => {
    const { container } = render(<BarChart data={data} series={series} />);
    expect(container.querySelectorAll('.pf-chart__bar').length).toBe(data.length * series.length);
  });

  it('renders bar tooltips with label and series info', () => {
    const { container } = render(<BarChart data={data} series={[series[0]]} />);
    const titles = container.querySelectorAll('rect title');
    expect(titles[0].textContent).toContain('Jan');
    expect(titles[0].textContent).toContain('Revenue');
  });

  it('renders the legend when there are multiple series', () => {
    render(<BarChart data={data} series={series} showLegend />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('renders stacked bars (same x per group)', () => {
    const { container } = render(<BarChart data={data} series={series} stacked />);
    const bars = container.querySelectorAll('.pf-chart__bar');
    expect(bars.length).toBe(data.length * series.length);
  });

  it('uses yAxisLabel as aria-label when provided', () => {
    render(<BarChart data={data} series={series} yAxisLabel="Monthly cost" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Monthly cost');
  });
});
