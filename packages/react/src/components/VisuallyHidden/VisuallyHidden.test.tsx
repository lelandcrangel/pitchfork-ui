import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders its content (available to assistive tech)', () => {
    render(<VisuallyHidden>Loading complete</VisuallyHidden>);
    expect(screen.getByText('Loading complete')).toBeInTheDocument();
  });

  it('renders a span by default with the hidden class', () => {
    render(<VisuallyHidden>x</VisuallyHidden>);
    const el = screen.getByText('x');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('pf-visually-hidden');
  });

  it('renders a custom element via the `as` prop', () => {
    render(<VisuallyHidden as="h2">Section title</VisuallyHidden>);
    expect(screen.getByText('Section title').tagName).toBe('H2');
  });

  it('adds the focusable modifier class', () => {
    render(
      <VisuallyHidden focusable>
        <a href="#main">Skip to content</a>
      </VisuallyHidden>,
    );
    const link = screen.getByText('Skip to content');
    expect(link.parentElement).toHaveClass('pf-visually-hidden--focusable');
  });

  it('forwards extra props', () => {
    render(
      <VisuallyHidden id="status" role="status">
        Saved
      </VisuallyHidden>,
    );
    const el = screen.getByText('Saved');
    expect(el).toHaveAttribute('id', 'status');
    expect(el).toHaveAttribute('role', 'status');
  });
});
