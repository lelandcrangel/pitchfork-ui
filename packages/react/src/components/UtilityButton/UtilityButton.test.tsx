import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UtilityButton } from './UtilityButton';

describe('UtilityButton', () => {
  it('renders a button', () => {
    render(<UtilityButton>Save</UtilityButton>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('defaults to type="button"', () => {
    render(<UtilityButton>Save</UtilityButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('applies the variant class', () => {
    render(<UtilityButton variant="danger">Delete</UtilityButton>);
    expect(screen.getByRole('button')).toHaveClass('pf-utility-button--danger');
  });

  it('defaults to neutral variant', () => {
    render(<UtilityButton>Action</UtilityButton>);
    expect(screen.getByRole('button')).toHaveClass('pf-utility-button--neutral');
  });

  it('applies the size class', () => {
    render(<UtilityButton size="sm">Small</UtilityButton>);
    expect(screen.getByRole('button')).toHaveClass('pf-utility-button--sm');
  });

  it('defaults to md size', () => {
    render(<UtilityButton>Action</UtilityButton>);
    expect(screen.getByRole('button')).toHaveClass('pf-utility-button--md');
  });

  it('renders the icon slot', () => {
    render(<UtilityButton icon={<span data-testid="icon" />}>Edit</UtilityButton>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<UtilityButton disabled>Save</UtilityButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<UtilityButton ref={ref}>Save</UtilityButton>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('warns when rendered with no visible text and no accessible label', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<UtilityButton icon={<span />} />);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('aria-label'));
    spy.mockRestore();
  });

  it('does not warn when aria-label is provided', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<UtilityButton icon={<span />} aria-label="Close" />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not warn when tooltip is provided', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<UtilityButton icon={<span />} tooltip="Close" />);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not warn when children are provided', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<UtilityButton>Save</UtilityButton>);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('sets title attribute from tooltip prop', () => {
    render(<UtilityButton icon={<span />} tooltip="Close dialog" />);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveAttribute(
      'title',
      'Close dialog',
    );
  });
});
