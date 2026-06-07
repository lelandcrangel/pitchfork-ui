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
