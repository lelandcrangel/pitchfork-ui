import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

// Convenience: get the underlying <input type="range">
const getSlider = () => screen.getByRole('slider');

describe('Slider', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a range input', () => {
    render(<Slider />);
    expect(getSlider()).toBeInTheDocument();
    expect(getSlider()).toHaveAttribute('type', 'range');
  });

  it('defaults to the min value when no default is provided', () => {
    render(<Slider min={10} max={50} />);
    expect(getSlider()).toHaveValue('10');
  });

  it('shows the defaultValue in uncontrolled mode', () => {
    render(<Slider defaultValue={40} />);
    expect(getSlider()).toHaveValue('40');
  });

  it('reflects the controlled value', () => {
    render(<Slider value={60} />);
    expect(getSlider()).toHaveValue('60');
  });

  it('sets min, max, and step attributes on the input', () => {
    render(<Slider min={5} max={95} step={5} />);
    const slider = getSlider();
    expect(slider).toHaveAttribute('min', '5');
    expect(slider).toHaveAttribute('max', '95');
    expect(slider).toHaveAttribute('step', '5');
  });

  // ─── Clamping ────────────────────────────────────────────────────────────

  it('clamps a controlled value above max down to max', () => {
    render(<Slider value={150} max={100} />);
    expect(getSlider()).toHaveValue('100');
  });

  it('clamps a controlled value below min up to min', () => {
    render(<Slider value={-10} min={0} />);
    expect(getSlider()).toHaveValue('0');
  });

  it('clamps defaultValue to the valid range', () => {
    render(<Slider defaultValue={200} min={0} max={100} />);
    expect(getSlider()).toHaveValue('100');
  });

  // ─── Step / value change ─────────────────────────────────────────────────

  it('calls onValueChange with the new value on change', () => {
    const onValueChange = vi.fn();
    render(<Slider onValueChange={onValueChange} />);
    fireEvent.change(getSlider(), { target: { value: '42' } });
    expect(onValueChange).toHaveBeenCalledWith(42);
  });

  it('updates the displayed value in uncontrolled mode on change', () => {
    render(<Slider defaultValue={0} showValue />);
    fireEvent.change(getSlider(), { target: { value: '75' } });
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('does not update the internal value in controlled mode', () => {
    const onValueChange = vi.fn();
    render(<Slider value={30} onValueChange={onValueChange} />);
    fireEvent.change(getSlider(), { target: { value: '70' } });
    // Controlled: input reflects the prop value, not the fired value
    expect(getSlider()).toHaveValue('30');
    expect(onValueChange).toHaveBeenCalledWith(70);
  });

  it('applies the step attribute so arrow keys change value in increments', () => {
    // jsdom does not implement native range keyboard behaviour, but we verify
    // the step attribute is wired correctly so the browser can honour it.
    render(<Slider step={10} />);
    expect(getSlider()).toHaveAttribute('step', '10');
  });

  it('sets the progress CSS custom property as a percentage', () => {
    render(<Slider value={50} min={0} max={100} />);
    expect(getSlider()).toHaveStyle({ '--pf-slider-progress': '50%' });
  });

  // ─── showValue ───────────────────────────────────────────────────────────

  it('shows the current value when showValue is true (default)', () => {
    render(<Slider value={33} />);
    expect(screen.getByText('33')).toBeInTheDocument();
  });

  it('hides the current value when showValue is false', () => {
    render(<Slider value={33} showValue={false} />);
    expect(screen.queryByText('33')).not.toBeInTheDocument();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('disables the input when disabled prop is set', () => {
    render(<Slider disabled />);
    expect(getSlider()).toBeDisabled();
  });

  // ─── Field: label, description, error, required ──────────────────────────

  it('associates the label with the range input', () => {
    render(<Slider label="Volume" />);
    const input = screen.getByRole('slider', { name: 'Volume' });
    expect(input).toBeInTheDocument();
  });

  it('shows a description', () => {
    render(<Slider label="Volume" description="Adjust the output level" />);
    expect(screen.getByText('Adjust the output level')).toBeInTheDocument();
  });

  it('shows an error message and sets aria-invalid', () => {
    render(<Slider label="Volume" error="Value out of range" />);
    expect(screen.getByText('Value out of range')).toBeInTheDocument();
    expect(getSlider()).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the required asterisk when required is set', () => {
    render(<Slider label="Volume" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
