import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Timeline, type TimelineItem } from './Timeline';

const items: TimelineItem[] = [
  { id: '1', title: 'Order placed', timestamp: '9:00 AM', tone: 'success' },
  { id: '2', title: 'Shipped', description: 'Left the warehouse.', timestamp: '2:30 PM' },
  { id: '3', title: 'Delivery failed', tone: 'danger', timestamp: 'Yesterday' },
];

describe('Timeline', () => {
  it('renders an ordered list of items', () => {
    render(<Timeline items={items} />);
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders titles, timestamps, and descriptions', () => {
    render(<Timeline items={items} />);
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    expect(screen.getByText('Left the warehouse.')).toBeInTheDocument();
  });

  it('applies the tone class to markers', () => {
    const { container } = render(<Timeline items={items} />);
    expect(container.querySelector('.pf-timeline__marker--success')).toBeInTheDocument();
    expect(container.querySelector('.pf-timeline__marker--danger')).toBeInTheDocument();
    // The middle item has no tone → default
    expect(container.querySelector('.pf-timeline__marker--default')).toBeInTheDocument();
  });

  it('omits the connector on the last item', () => {
    const { container } = render(<Timeline items={items} />);
    const connectors = container.querySelectorAll('.pf-timeline__connector');
    expect(connectors).toHaveLength(items.length - 1);
    expect(container.querySelector('.pf-timeline__item--last')).toBeInTheDocument();
  });

  it('renders a marker icon when provided', () => {
    const { container } = render(
      <Timeline items={[{ title: 'With icon', icon: <svg data-testid="ic" /> }]} />,
    );
    expect(container.querySelector('.pf-timeline__marker-icon')).toBeInTheDocument();
  });

  it('forwards extra props to the root list', () => {
    render(<Timeline items={items} aria-label="Order history" />);
    expect(screen.getByRole('list', { name: 'Order history' })).toBeInTheDocument();
  });
});
