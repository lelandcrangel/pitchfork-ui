import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ContentDivider } from './ContentDivider';

describe('ContentDivider', () => {
  it('renders with role="separator"', () => {
    render(<ContentDivider />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('defaults to horizontal orientation', () => {
    render(<ContentDivider />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('sets aria-orientation to vertical when orientation="vertical"', () => {
    render(<ContentDivider orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('applies vertical CSS class when orientation="vertical"', () => {
    render(<ContentDivider orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveClass('pf-content-divider--vertical');
  });

  it('renders the label text when label is provided', () => {
    render(<ContentDivider label="OR" />);
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('does not render label when omitted', () => {
    render(<ContentDivider />);
    expect(screen.queryByText('OR')).not.toBeInTheDocument();
  });

  it('applies inset class when inset=true', () => {
    render(<ContentDivider inset />);
    expect(screen.getByRole('separator')).toHaveClass('pf-content-divider--inset');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ContentDivider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
