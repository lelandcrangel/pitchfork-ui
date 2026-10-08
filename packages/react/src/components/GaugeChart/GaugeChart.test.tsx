import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GaugeChart } from './GaugeChart';

describe('GaugeChart', () => {
  it('renders a meter landmark', () => {
    render(<GaugeChart value={67} />);
    expect(screen.getByRole('meter')).toBeInTheDocument();
  });

  it('sets aria-valuenow, aria-valuemin, aria-valuemax', () => {
    render(<GaugeChart value={40} max={200} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '40');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '200');
  });

  it('renders the default percentage label', () => {
    render(<GaugeChart value={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders a custom centerLabel', () => {
    render(<GaugeChart value={50} centerLabel="1,240" />);
    expect(screen.getByText('1,240')).toBeInTheDocument();
  });

  it('renders a subLabel when provided', () => {
    render(<GaugeChart value={67} subLabel="Completion" />);
    expect(screen.getByText('Completion')).toBeInTheDocument();
  });

  it('does not render subLabel when omitted', () => {
    const { container } = render(<GaugeChart value={67} />);
    expect(container.querySelector('.pf-gauge__sub-label')).not.toBeInTheDocument();
  });

  it('clamps value above max', () => {
    render(<GaugeChart value={150} max={100} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-label', '100%');
  });

  it('clamps value below 0', () => {
    render(<GaugeChart value={-10} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-label', '0%');
  });

  it('renders 0% correctly', () => {
    render(<GaugeChart value={0} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
  });

  it('forwards extra props to the root element', () => {
    render(<GaugeChart value={50} data-testid="gauge" />);
    expect(screen.getByTestId('gauge')).toBeInTheDocument();
  });

  it('applies size as width and height on the root element', () => {
    render(<GaugeChart value={50} size={160} data-testid="gauge" />);
    const el = screen.getByTestId('gauge');
    expect(el).toHaveStyle({ width: '160px', height: '160px' });
  });
});

/*
 * The geometry is core's, shared with `ProgressCircle` and
 * `<pf-progress-circle>`, which fixed a `NaN`: the old clamp was
 * `Math.min(Math.max(value, 0), max)`, and `Math.max(NaN, 0)` is `NaN`, so an
 * unparsed value reached the DOM as `--pf-gauge-offset: NaN` and nothing drew.
 */
describe('GaugeChart edge cases', () => {
  const fillOf = (container: HTMLElement) =>
    container.querySelector('.pf-gauge__fill') as SVGCircleElement;

  it('draws nothing for a value that is not a number, rather than NaN', () => {
    const { container } = render(<GaugeChart value={Number.NaN} />);
    const style = fillOf(container).getAttribute('style') ?? '';

    expect(style).not.toMatch(/NaN/);
    expect(container.querySelector('.pf-gauge')?.textContent).toContain('0%');
  });

  it('reports nothing drawable for a max of zero', () => {
    const { container } = render(<GaugeChart value={10} max={0} />);
    expect(fillOf(container).getAttribute('style') ?? '').not.toMatch(/NaN/);
  });

  it('clamps an overshoot to the full arc', () => {
    const { container } = render(<GaugeChart value={500} max={100} />);
    const style = fillOf(container).getAttribute('style') ?? '';

    expect(container.querySelector('.pf-gauge')?.textContent).toContain('100%');
    // A full arc has no offset left.
    expect(style).toMatch(/--pf-gauge-offset:\s*0/);
  });

  /* The stroke straddles the path, so the radius is inset by half of it. */
  it('insets the radius by half the stroke so the arc is not clipped', () => {
    const { container } = render(<GaugeChart value={50} size={200} strokeWidth={16} />);
    expect(fillOf(container).getAttribute('r')).toBe('92');
  });
});
