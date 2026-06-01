import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BadgeGroup } from './BadgeGroup';

describe('BadgeGroup', () => {
  it('renders the label', () => {
    render(<BadgeGroup label="New" message="Feature released" />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders the message', () => {
    render(<BadgeGroup label="v2.0" message="Now available" />);
    expect(screen.getByText('Now available')).toBeInTheDocument();
  });

  it('applies the color class to the badge', () => {
    const { container } = render(
      <BadgeGroup label="Alert" message="Something happened" color="error" />,
    );
    expect(container.querySelector('.pf-badge-group__badge--error')).toBeInTheDocument();
  });

  it('applies the appearance class', () => {
    const { container } = render(
      <BadgeGroup label="Tag" message="Info" appearance="modern" />,
    );
    expect(container.firstChild).toHaveClass('pf-badge-group--modern');
  });

  it('defaults to pill appearance', () => {
    const { container } = render(<BadgeGroup label="X" message="Y" />);
    expect(container.firstChild).toHaveClass('pf-badge-group--pill');
  });

  it('applies leading badge position class by default', () => {
    const { container } = render(<BadgeGroup label="X" message="Y" />);
    expect(container.firstChild).toHaveClass('pf-badge-group--leading');
  });

  it('applies trailing badge position class', () => {
    const { container } = render(
      <BadgeGroup label="X" message="Y" badgePosition="trailing" />,
    );
    expect(container.firstChild).toHaveClass('pf-badge-group--trailing');
  });
});
