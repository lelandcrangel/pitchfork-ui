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

/*
 * Both fixed by moving the arithmetic to core. The first is the live one: a
 * value that is not a number survived `Math.max(value, 0)` as `NaN`, took the
 * total with it past the `total <= 0` guard, and produced
 * `conic-gradient(… NaN% NaN%)` — invalid, so the whole chart drew blank.
 */
describe('PieChart arithmetic', () => {
  const gradientOf = (container: HTMLElement) =>
    (container.querySelector('.pf-pie-chart__gradient') as HTMLElement).getAttribute('style') ?? '';

  it('draws the rest of the data when one value is not a number', () => {
    const { container } = render(
      <PieChart
        data={[
          { label: 'Bad', value: Number.NaN },
          { label: 'Good', value: 4 },
        ]}
      />,
    );

    expect(gradientOf(container)).not.toMatch(/NaN/);
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.queryByText('Bad')).not.toBeInTheDocument();
  });

  /* Rounding each share on its own shows three equal thirds as 33/33/33. */
  it('prints legend shares that add up to 100', () => {
    const { container } = render(
      <PieChart
        data={[
          { label: 'A', value: 1 },
          { label: 'B', value: 1 },
          { label: 'C', value: 1 },
        ]}
      />,
    );

    const shares = Array.from(container.querySelectorAll('.pf-pie-chart__legend-value')).map(
      (node) => Number.parseInt(node.textContent ?? '0', 10),
    );

    expect(shares).toEqual([34, 33, 33]);
    expect(shares.reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  /* A zero slice is a legend entry nobody can see, so it is dropped. */
  it('leaves a zero slice out of the chart and the legend', () => {
    const { container } = render(
      <PieChart
        data={[
          { label: 'Shown', value: 3 },
          { label: 'Empty', value: 0 },
        ]}
      />,
    );

    expect(container.querySelectorAll('.pf-pie-chart__legend-item')).toHaveLength(1);
    expect(screen.queryByText('Empty')).not.toBeInTheDocument();
  });

  /* The legend label has to follow the slice, not its position after filtering. */
  it('labels each remaining slice with its own label', () => {
    const { container } = render(
      <PieChart
        data={[
          { label: 'First', value: 0 },
          { label: 'Second', value: 1 },
          { label: 'Third', value: 1 },
        ]}
      />,
    );

    const labels = Array.from(container.querySelectorAll('.pf-pie-chart__legend-label')).map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(['Second', 'Third']);
  });

  it('refuses a cutout that would leave no chart', () => {
    const { container } = render(
      <PieChart data={[{ label: 'A', value: 1 }]} size={200} cutout={1} />,
    );
    const centre = container.querySelector('.pf-pie-chart__center') as HTMLElement;

    expect(centre.style.width).toBe('176px');
  });
});
