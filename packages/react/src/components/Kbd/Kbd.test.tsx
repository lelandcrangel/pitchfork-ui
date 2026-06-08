import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd } from './Kbd';

describe('Kbd', () => {
  it('renders a kbd element with its children', () => {
    render(<Kbd>Esc</Kbd>);
    const el = screen.getByText('Esc');
    expect(el.tagName).toBe('KBD');
    expect(el).toHaveClass('pf-kbd');
  });

  it('joins a combo into a single cap with the default separator', () => {
    render(<Kbd keys={['⌘', 'K']} />);
    expect(screen.getByText('⌘ + K')).toBeInTheDocument();
  });

  it('uses a custom separator', () => {
    render(<Kbd keys={['A', 'B']} separator="then" />);
    expect(screen.getByText('A then B')).toBeInTheDocument();
  });

  it('applies the size class', () => {
    render(<Kbd size="sm">/</Kbd>);
    expect(screen.getByText('/')).toHaveClass('pf-kbd--sm');
  });

  it('forwards extra props', () => {
    render(<Kbd data-testid="kbd">Tab</Kbd>);
    expect(screen.getByTestId('kbd')).toBeInTheDocument();
  });
});
