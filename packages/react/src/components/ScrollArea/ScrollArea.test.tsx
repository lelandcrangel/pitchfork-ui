import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScrollArea } from './ScrollArea';

describe('ScrollArea', () => {
  it('renders children inside a scroll container', () => {
    render(
      <ScrollArea data-testid="sa">
        <p>Scrollable content</p>
      </ScrollArea>,
    );
    const region = screen.getByTestId('sa');
    expect(region).toHaveClass('pf-scroll-area');
    expect(region).toHaveTextContent('Scrollable content');
  });

  it('defaults to the vertical orientation', () => {
    render(<ScrollArea data-testid="sa">x</ScrollArea>);
    expect(screen.getByTestId('sa')).toHaveClass('pf-scroll-area--vertical');
  });

  it('applies the requested orientation', () => {
    const { rerender } = render(
      <ScrollArea data-testid="sa" orientation="horizontal">
        x
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).toHaveClass('pf-scroll-area--horizontal');
    rerender(
      <ScrollArea data-testid="sa" orientation="both">
        x
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).toHaveClass('pf-scroll-area--both');
  });

  it('is keyboard-focusable by default', () => {
    render(<ScrollArea data-testid="sa">x</ScrollArea>);
    expect(screen.getByTestId('sa')).toHaveAttribute('tabindex', '0');
  });

  it('omits tabindex when focusable is false', () => {
    render(
      <ScrollArea data-testid="sa" focusable={false}>
        x
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).not.toHaveAttribute('tabindex');
  });

  it('respects an explicit tabIndex', () => {
    render(
      <ScrollArea data-testid="sa" tabIndex={-1}>
        x
      </ScrollArea>,
    );
    expect(screen.getByTestId('sa')).toHaveAttribute('tabindex', '-1');
  });

  it('forwards aria-label for a labelled scroll region', () => {
    render(
      <ScrollArea aria-label="Log output" role="region">
        x
      </ScrollArea>,
    );
    expect(screen.getByRole('region', { name: 'Log output' })).toBeInTheDocument();
  });
});
