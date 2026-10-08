import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkline } from './Sparkline';

describe('Sparkline', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies accessible label when provided', () => {
    const { getByRole } = render(<Sparkline data={[1, 2, 3]} label="Revenue trend" />);
    expect(getByRole('img', { name: 'Revenue trend' })).toBeInTheDocument();
  });

  it('renders as presentation when no label is provided', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} />);
    expect(container.querySelector('svg')).toHaveAttribute('role', 'presentation');
  });

  it('renders the line path', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    expect(container.querySelector('.pf-sparkline__line')).toBeInTheDocument();
  });

  it('renders the area path when variant is area', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} variant="area" />);
    expect(container.querySelector('.pf-sparkline__area')).toBeInTheDocument();
  });

  it('does not render area path for line variant', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} variant="line" />);
    expect(container.querySelector('.pf-sparkline__area')).not.toBeInTheDocument();
  });

  it('renders end dot when endDot is true', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} endDot />);
    expect(container.querySelector('.pf-sparkline__dot')).toBeInTheDocument();
  });

  it('does not render end dot by default', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    expect(container.querySelector('.pf-sparkline__dot')).not.toBeInTheDocument();
  });

  it('handles a single data point without crashing', () => {
    const { container } = render(<Sparkline data={[42]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('handles empty data without crashing', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('handles flatline data without crashing', () => {
    const { container } = render(<Sparkline data={[5, 5, 5, 5, 5]} />);
    expect(container.querySelector('.pf-sparkline__line')).toBeInTheDocument();
  });

  it('forwards extra props to the SVG element', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} data-testid="spark" />);
    expect(container.querySelector('[data-testid="spark"]')).toBeInTheDocument();
  });
});

/*
 * The three edge cases the geometry used to get wrong, now core's. The first
 * is the live one: `i / (data.length - 1)` with one value divides by zero, so
 * `x` was `NaN` and an end dot rendered `cx="NaN"`.
 */
describe('Sparkline edge cases', () => {
  const svgOf = (container: HTMLElement) => container.querySelector('svg') as SVGSVGElement;

  it('places a single value without an invalid coordinate', () => {
    const { container } = render(<Sparkline data={[7]} endDot width={100} height={40} />);
    const dot = svgOf(container).querySelector('circle') as SVGCircleElement;

    expect(dot.getAttribute('cx')).toBe('50');
    expect(dot.getAttribute('cy')).toBe('20');
  });

  it('centres a flat series rather than pinning it to an edge', () => {
    const { container } = render(<Sparkline data={[5, 5, 5]} width={100} height={40} />);
    const d = svgOf(container).querySelector('path')?.getAttribute('d') ?? '';

    // Every y is the box's middle.
    expect(d.match(/\d+(\.\d+)? 20\b/g)).toHaveLength(3);
  });

  it('draws no path at all from no data', () => {
    const { container } = render(<Sparkline data={[]} />);
    expect(svgOf(container).querySelector('path')).toBeNull();
  });

  /* The closing branch of the old path builder put a boolean in the `d`. */
  it('puts no non-number in an area path', () => {
    const { container } = render(<Sparkline data={[1, 4, 2]} variant="area" />);
    const paths = Array.from(svgOf(container).querySelectorAll('path'));

    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path.getAttribute('d')).not.toMatch(/true|false|NaN|undefined/);
    }
  });
});
