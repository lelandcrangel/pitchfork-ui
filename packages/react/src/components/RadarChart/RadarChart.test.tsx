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
