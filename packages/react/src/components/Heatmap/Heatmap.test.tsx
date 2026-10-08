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

/*
 * The arithmetic is core's now, which fixed two things. The first is the live
 * one: `Math.max(max, d.value)` and `sum + d.value` each carry one `NaN`
 * through everything, so every cell's level came out `NaN` and the
 * accessible summary read "NaN total".
 */
describe('Heatmap arithmetic', () => {
  const cellsOf = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('.pf-heatmap__cell:not(.pf-heatmap__cell--empty)'));

  it('draws the rest of the data when one value is not a number', () => {
    const { container } = render(
      <Heatmap
        data={[
          { date: '2024-03-04', value: Number.NaN },
          { date: '2024-03-05', value: 4 },
        ]}
      />,
    );

    const label = container.querySelector('.pf-heatmap')?.getAttribute('aria-label') ?? '';
    expect(label).not.toMatch(/NaN/);
    expect(label).toContain('4 total');

    for (const cell of cellsOf(container)) {
      expect(cell.getAttribute('data-level')).not.toBe('NaN');
      expect(cell.getAttribute('style') ?? '').not.toMatch(/NaN/);
    }
  });

  /* A day with one commit must not look like a day with none. */
  it('gives the smallest positive value a level of its own', () => {
    const { container } = render(
      <Heatmap
        data={[
          { date: '2024-03-04', value: 1 },
          { date: '2024-03-05', value: 1000 },
        ]}
      />,
    );
    const levels = cellsOf(container).map((cell) => cell.getAttribute('data-level'));

    expect(levels).toContain('1');
    expect(levels).toContain('4');
    expect(levels).not.toContain('0');
  });

  /*
   * A day step from midnight across a daylight-saving boundary loses or
   * repeats a day. Core pins every date to midday, so a range spanning the
   * spring-forward Sunday has each day exactly once.
   */
  it('covers a daylight-saving boundary once per day', () => {
    const { container } = render(<Heatmap startDate="2024-03-01" endDate="2024-03-31" data={[]} />);
    const titles = cellsOf(container).map((cell) => cell.getAttribute('title'));

    expect(titles).toHaveLength(31);
    expect(new Set(titles).size).toBe(31);
    expect(titles).toContain('2024-03-10: 0');
  });

  /* `new Date('2024-02-31')` rolls forward; the parse refuses it. */
  it('shows its empty state for a date that is not one', () => {
    render(<Heatmap data={[{ date: '2024-02-31', value: 1 }]} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
