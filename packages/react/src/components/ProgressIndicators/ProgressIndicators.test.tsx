import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar, ProgressCircle } from './ProgressIndicators';

describe('ProgressBar', () => {
  // ─── Role & ARIA ─────────────────────────────────────────────────────────

  it('renders with role="progressbar"', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets aria-valuemin=0', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
  });

  it('sets aria-valuemax to the max prop', () => {
    render(<ProgressBar value={50} max={200} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '200');
  });

  it('defaults aria-valuemax to 100', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it('sets aria-valuenow to the current value', () => {
    render(<ProgressBar value={75} max={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('sets aria-valuenow relative to max', () => {
    render(<ProgressBar value={1} max={4} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  // ─── Value label ─────────────────────────────────────────────────────────

  it('renders the percentage label by default', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('hides the label when showValue=false', () => {
    render(<ProgressBar value={50} showValue={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('rounds the displayed percentage', () => {
    render(<ProgressBar value={1} max={3} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  // ─── Clamping ────────────────────────────────────────────────────────────

  it('clamps value below 0 to 0%', () => {
    render(<ProgressBar value={-10} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps value above max to 100%', () => {
    render(<ProgressBar value={200} max={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('returns 0% when max is 0', () => {
    render(<ProgressBar value={50} max={0} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  // ─── Fill width ──────────────────────────────────────────────────────────

  it('sets the fill element width to the computed percent', () => {
    const { container } = render(<ProgressBar value={25} max={100} />);
    const fill = container.querySelector<HTMLElement>('.pf-progress-bar__fill');
    expect(fill).toHaveStyle({ width: '25%' });
  });
});

describe('ProgressCircle', () => {
  // ─── Role & ARIA ─────────────────────────────────────────────────────────

  it('renders with role="progressbar"', () => {
    render(<ProgressCircle value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets aria-valuemin=0', () => {
    render(<ProgressCircle value={50} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
  });

  it('sets aria-valuemax to the max prop', () => {
    render(<ProgressCircle value={50} max={200} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '200');
  });

  it('sets aria-valuenow to the current value', () => {
    render(<ProgressCircle value={60} max={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });

  // ─── Value label ─────────────────────────────────────────────────────────

  it('renders the percentage label by default', () => {
    render(<ProgressCircle value={40} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('hides the label when showValue=false', () => {
    render(<ProgressCircle value={40} showValue={false} />);
    expect(screen.queryByText('40%')).not.toBeInTheDocument();
  });

  // ─── Clamping ────────────────────────────────────────────────────────────

  it('clamps value below 0 to 0%', () => {
    render(<ProgressCircle value={-5} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps value above max to 100%', () => {
    render(<ProgressCircle value={999} max={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  // ─── SVG ─────────────────────────────────────────────────────────────────

  it('renders an aria-hidden SVG', () => {
    const { container } = render(<ProgressCircle value={50} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden');
  });

  it('applies size via inline style', () => {
    render(<ProgressCircle value={50} size={96} />);
    expect(screen.getByRole('progressbar')).toHaveStyle({ width: '96px', height: '96px' });
  });
});
