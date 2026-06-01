import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its content', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies the variant class', () => {
    render(<Badge variant="success">Done</Badge>);
    expect(screen.getByText('Done')).toHaveClass('pf-badge--success');
  });

  it('defaults to neutral variant', () => {
    render(<Badge>Item</Badge>);
    expect(screen.getByText('Item')).toHaveClass('pf-badge--neutral');
  });

  it('applies the base pf-badge class', () => {
    render(<Badge>X</Badge>);
    expect(screen.getByText('X')).toHaveClass('pf-badge');
  });

  it('forwards ref to the span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>ref</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes extra props through', () => {
    render(<Badge data-testid="my-badge">test</Badge>);
    expect(screen.getByTestId('my-badge')).toBeInTheDocument();
  });
});
