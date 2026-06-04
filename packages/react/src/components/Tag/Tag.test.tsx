import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders its children', () => {
    render(<Tag>Design</Tag>);
    expect(screen.getByText('Design')).toBeInTheDocument();
  });

  it('applies the variant class', () => {
    const { container } = render(<Tag variant="success">Done</Tag>);
    expect(container.firstChild).toHaveClass('pf-tag--success');
  });

  it('defaults to neutral variant', () => {
    const { container } = render(<Tag>Item</Tag>);
    expect(container.firstChild).toHaveClass('pf-tag--neutral');
  });

  it('does not render dismiss button by default', () => {
    render(<Tag>Label</Tag>);
    expect(screen.queryByRole('button', { name: 'Remove tag' })).not.toBeInTheDocument();
  });

  it('renders dismiss button when dismissible=true', () => {
    render(<Tag dismissible>Label</Tag>);
    expect(screen.getByRole('button', { name: 'Remove tag' })).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Tag dismissible onDismiss={onDismiss}>
        Label
      </Tag>,
    );
    await user.click(screen.getByRole('button', { name: 'Remove tag' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the root span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Tag ref={ref}>Ref</Tag>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
