import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AreaChart,
  BarChart,
  LineChart,
  type ChartDataPoint,
  type ChartSeries,
} from './LineBarChart';

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

  it('exposes the plot inset var so the legend aligns with the plot area', () => {
    render(<LineChart data={data} series={series} data-testid="chart" />);
    const inset = screen.getByTestId('chart').style.getPropertyValue('--pf-chart-plot-inset-left');
    expect(inset).toMatch(/^\d+(\.\d+)?%$/);
  });

  it('merges consumer style without dropping the plot inset var', () => {
    render(<LineChart data={data} series={series} data-testid="chart" style={{ color: 'red' }} />);
    const root = screen.getByTestId('chart');
    expect(root.style.color).toBe('red');
    expect(root.style.getPropertyValue('--pf-chart-plot-inset-left')).not.toBe('');
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

  it('exposes the plot inset var so the legend aligns with the plot area', () => {
    render(<BarChart data={data} series={series} data-testid="chart" />);
    const inset = screen.getByTestId('chart').style.getPropertyValue('--pf-chart-plot-inset-left');
    expect(inset).toMatch(/^\d+(\.\d+)?%$/);
  });
});

describe('AreaChart', () => {
  it('renders with role="img"', () => {
    render(<AreaChart data={data} series={series} />);
    expect(screen.getAllByRole('img')[0]).toBeInTheDocument();
  });

  it('renders area fill paths', () => {
    const { container } = render(<AreaChart data={data} series={series} />);
    const paths = container.querySelectorAll('path[fill]:not([fill="none"])');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('renders empty state when data is empty', () => {
    render(<AreaChart data={[]} series={series} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('forwards extra props to the root element', () => {
    render(<AreaChart data={data} series={series} data-testid="area-chart" />);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});

/*
 * The scales and paths are core's now, which fixed two things that were
 * silent. The axis ticks used to be accumulated with `v += step`, so a
 * fractional step printed `0.30000000000000004` as a label; and a maximum
 * that is not a number fell through the `<= 0` guard and produced an *empty*
 * tick array, after which `maxTick` was `undefined` and every coordinate came
 * out `NaN`.
 */
describe('chart scales', () => {
  const ticksOf = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('.pf-chart__tick--y')).map((node) => node.textContent);
  const pathsOf = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('path')).map((node) => node.getAttribute('d') ?? '');

  it('prints clean fractional axis labels', () => {
    const { container } = render(
      <LineChart
        data={[
          { label: 'a', v: 0.1 },
          { label: 'b', v: 0.5 },
        ]}
        series={[{ key: 'v', label: 'V' }]}
      />,
    );

    expect(ticksOf(container)).toEqual(['0', '0.1', '0.2', '0.3', '0.4', '0.5']);
  });

  it('draws a usable chart when a value is not a number', () => {
    const { container } = render(
      <LineChart
        data={[
          { label: 'a', v: 'oops' },
          { label: 'b', v: 'nope' },
        ]}
        series={[{ key: 'v', label: 'V' }]}
      />,
    );

    expect(ticksOf(container).length).toBeGreaterThan(1);
    expect(ticksOf(container).join()).not.toMatch(/NaN|undefined/);
    for (const path of pathsOf(container)) {
      expect(path).not.toMatch(/NaN|undefined/);
    }
  });

  it('closes an area path back to the plot floor', () => {
    const { container } = render(
      <AreaChart
        data={[
          { label: 'a', v: 1 },
          { label: 'b', v: 2 },
        ]}
        series={[{ key: 'v', label: 'V' }]}
      />,
    );
    const area = pathsOf(container).find((path) => path.endsWith('Z'));

    expect(area).toBeTruthy();
    expect(area).not.toMatch(/NaN/);
  });

  /*
   * A negative `width` on a `<rect>` is an error the browser drops the
   * element for, so a chart of twelve series silently lost its bars.
   */
  it('keeps every bar wider than nothing with many series', () => {
    /*
     * Six groups and twenty series: that is where
     * `(total - gap * (m - 1)) / m` actually goes negative. One group of
     * twelve still comes out positive, which is how the first version of this
     * test passed with the fix reverted.
     */
    const series = Array.from({ length: 20 }, (_, index) => ({
      key: `s${index}`,
      label: `S${index}`,
    }));
    const data = Array.from({ length: 6 }, (_, group) => {
      const row = { label: `g${group}` } as Record<string, string | number>;
      for (const item of series) row[item.key] = 5;
      return row;
    });

    const { container } = render(<BarChart data={data as never} series={series} />);
    const widths = Array.from(container.querySelectorAll('rect')).map((node) =>
      Number(node.getAttribute('width')),
    );

    expect(widths).toHaveLength(120);
    expect(widths.every((width) => width > 0)).toBe(true);
  });

  /* A single point has no span to spread across, so it goes in the middle. */
  it('centres a single data point', () => {
    const { container } = render(
      <LineChart data={[{ label: 'only', v: 5 }]} series={[{ key: 'v', label: 'V' }]} />,
    );
    const dot = container.querySelector('.pf-chart__dot') as SVGCircleElement;

    // 560 wide, 56 left and 32 right of padding: the middle of the plot is 292.
    expect(Number(dot.getAttribute('cx'))).toBeCloseTo(292, 6);
  });

  it('thins the x labels out on a long series', () => {
    const data = Array.from({ length: 40 }, (_, index) => ({ label: `d${index}`, v: index }));
    const { container } = render(<LineChart data={data} series={[{ key: 'v', label: 'V' }]} />);

    expect(container.querySelectorAll('.pf-chart__tick--x')).toHaveLength(10);
  });
});
