import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RadarChart, type RadarChartDatum } from './RadarChart';

const data: RadarChartDatum[] = [
  { label: 'Speed', value: 80 },
  { label: 'Strength', value: 60 },
  { label: 'Agility', value: 70 },
  { label: 'Endurance', value: 90 },
];

describe('RadarChart', () => {
  it('renders with role="img"', () => {
    render(<RadarChart data={data} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('shows error message when fewer than 3 data points are provided', () => {
    render(
      <RadarChart
        data={[
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ]}
      />,
    );
    expect(screen.getByText('RadarChart needs at least 3 data points.')).toBeInTheDocument();
  });

  it('shows error message for empty data', () => {
    render(<RadarChart data={[]} />);
    expect(screen.getByText('RadarChart needs at least 3 data points.')).toBeInTheDocument();
  });

  it('renders axis labels in the SVG', () => {
    render(<RadarChart data={data} />);
    expect(screen.getAllByText('Speed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Endurance').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the value polygon', () => {
    const { container } = render(<RadarChart data={data} />);
    expect(container.querySelector('.pf-radar-chart__area')).toBeInTheDocument();
  });

  it('renders grid polygons', () => {
    const { container } = render(<RadarChart data={data} />);
    const grids = container.querySelectorAll('.pf-radar-chart__grid');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('renders axis lines when showAxes=true', () => {
    const { container } = render(<RadarChart data={data} showAxes />);
    expect(container.querySelectorAll('.pf-radar-chart__axis').length).toBe(data.length);
  });

  it('does not render axis lines when showAxes=false', () => {
    const { container } = render(<RadarChart data={data} showAxes={false} />);
    expect(container.querySelectorAll('.pf-radar-chart__axis')).toHaveLength(0);
  });

  it('renders the legend when showLegend=true', () => {
    render(<RadarChart data={data} showLegend />);
    expect(screen.getAllByText('Speed').length).toBeGreaterThanOrEqual(1);
  });

  it('hides the legend when showLegend=false', () => {
    const { container } = render(<RadarChart data={data} showLegend={false} />);
    expect(container.querySelector('.pf-radar-chart__legend')).not.toBeInTheDocument();
  });
});

/*
 * The geometry is core's now. Two behaviours it pins that were accidental
 * before: a value above an explicit `max` is clamped to the outer ring rather
 * than drawn outside the viewBox and clipped away, and a value that is not a
 * number is dropped rather than relied on to fail `>= 0`.
 */
describe('RadarChart geometry', () => {
  const axes = [
    { label: 'A', value: 1 },
    { label: 'B', value: 1 },
    { label: 'C', value: 1 },
  ];
  const pointsOf = (container: HTMLElement, selector: string) =>
    (container.querySelector(selector) as SVGPolygonElement).getAttribute('points') ?? '';

  it('starts the first axis at the top', () => {
    const { container } = render(<RadarChart data={axes} size={200} max={1} />);
    // size 200 → centre 100, outer radius 64, so the first point is 36 above.
    expect(pointsOf(container, '.pf-radar-chart__area').split(' ')[0]).toBe('100.00,36.00');
  });

  it('clamps a value above the scale to the outer ring', () => {
    const { container } = render(
      <RadarChart
        data={[
          { label: 'A', value: 500 },
          { label: 'B', value: 1 },
          { label: 'C', value: 1 },
        ]}
        size={200}
        max={1}
      />,
    );
    const first = pointsOf(container, '.pf-radar-chart__area').split(' ')[0];

    expect(first).toBe('100.00,36.00');
  });

  it('drops a value that is not a number', () => {
    const { container } = render(
      <RadarChart
        data={[
          { label: 'A', value: Number.NaN },
          { label: 'B', value: 1 },
          { label: 'C', value: 1 },
          { label: 'D', value: 1 },
        ]}
      />,
    );

    expect(pointsOf(container, '.pf-radar-chart__area')).not.toMatch(/NaN/);
    expect(container.querySelectorAll('.pf-radar-chart__point')).toHaveLength(3);
  });

  /* Fewer than three axes enclose nothing. */
  it('refuses fewer than three axes', () => {
    render(
      <RadarChart
        data={[
          { label: 'A', value: 1 },
          { label: 'B', value: 1 },
        ]}
      />,
    );
    expect(screen.getByText(/at least 3 data points/i)).toBeInTheDocument();
  });

  it('keeps a grid for a chart of all zeroes', () => {
    const { container } = render(
      <RadarChart data={axes.map((axis) => ({ ...axis, value: 0 }))} size={200} />,
    );

    expect(container.querySelectorAll('.pf-radar-chart__grid').length).toBeGreaterThan(1);
    expect(pointsOf(container, '.pf-radar-chart__area')).not.toMatch(/NaN/);
  });

  it('draws one ring per level, the outermost at the edge', () => {
    const { container } = render(<RadarChart data={axes} size={200} levels={4} />);
    const rings = Array.from(container.querySelectorAll('.pf-radar-chart__grid'));

    expect(rings).toHaveLength(4);
    expect(rings[3].getAttribute('points')?.split(' ')[0]).toBe('100.00,36.00');
  });
});
