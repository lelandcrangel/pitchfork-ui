import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Heatmap, type HeatmapDatum } from './Heatmap';

const data: HeatmapDatum[] = [
  { date: '2025-01-01', value: 0 },
  { date: '2025-01-02', value: 3 },
  { date: '2025-01-03', value: 8 },
  { date: '2025-01-15', value: 12 },
  { date: '2025-02-01', value: 5 },
];

describe('Heatmap', () => {
  it('renders with role="img"', () => {
    render(<Heatmap data={data} startDate="2025-01-01" endDate="2025-02-28" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('generates a default accessible label with the total', () => {
    render(<Heatmap data={data} startDate="2025-01-01" endDate="2025-02-28" />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('28 total'),
    );
  });

  it('uses a custom label when provided', () => {
    render(<Heatmap data={data} label="My activity" startDate="2025-01-01" endDate="2025-02-28" />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'My activity');
  });

  it('renders cells with native tooltips via the title attribute', () => {
    const { container } = render(
      <Heatmap data={data} startDate="2025-01-01" endDate="2025-01-07" />,
    );
    const cell = container.querySelector('[title="2025-01-03: 8"]');
    expect(cell).toBeInTheDocument();
  });

  it('applies the value formatter to tooltips', () => {
    const { container } = render(
      <Heatmap
        data={data}
        startDate="2025-01-01"
        endDate="2025-01-07"
        valueFormatter={(v, date) => `${v} on ${date}`}
      />,
    );
    expect(container.querySelector('[title="8 on 2025-01-03"]')).toBeInTheDocument();
  });

  it('assigns level 0 to zero-value days', () => {
    const { container } = render(
      <Heatmap data={data} startDate="2025-01-01" endDate="2025-01-07" />,
    );
    const cell = container.querySelector('[title="2025-01-01: 0"]');
    expect(cell).toHaveAttribute('data-level', '0');
  });

  it('assigns the top level to the max-value day', () => {
    const { container } = render(
      <Heatmap data={data} startDate="2025-01-01" endDate="2025-01-31" levels={5} />,
    );
    const cell = container.querySelector('[title="2025-01-15: 12"]');
    expect(cell).toHaveAttribute('data-level', '4');
  });

  it('renders the empty state when there is no data or range', () => {
    render(<Heatmap data={[]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders a custom empty label', () => {
    render(<Heatmap data={[]} emptyLabel="Nothing tracked yet" />);
    expect(screen.getByText('Nothing tracked yet')).toBeInTheDocument();
  });

  it('renders weekday labels by default', () => {
    const { container } = render(
      <Heatmap data={data} startDate="2025-01-01" endDate="2025-02-28" />,
    );
    expect(container.querySelector('.pf-heatmap__weekdays')).toBeInTheDocument();
  });

  it('hides weekday labels when showWeekdayLabels is false', () => {
    const { container } = render(
      <Heatmap data={data} startDate="2025-01-01" endDate="2025-02-28" showWeekdayLabels={false} />,
    );
    expect(container.querySelector('.pf-heatmap__weekdays')).not.toBeInTheDocument();
  });

  it('forwards extra props to the root element', () => {
    render(
      <Heatmap data={data} startDate="2025-01-01" endDate="2025-01-07" data-testid="heatmap" />,
    );
    expect(screen.getByTestId('heatmap')).toBeInTheDocument();
  });
});
