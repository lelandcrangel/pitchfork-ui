import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Carousel } from './Carousel';

const slides = [
  <div key="1">Slide A</div>,
  <div key="2">Slide B</div>,
  <div key="3">Slide C</div>,
];

describe('Carousel', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders all slides', () => {
    render(<Carousel slides={slides} />);
    expect(screen.getByText('Slide A')).toBeInTheDocument();
    expect(screen.getByText('Slide B')).toBeInTheDocument();
    expect(screen.getByText('Slide C')).toBeInTheDocument();
  });

  it('renders Previous and Next buttons', () => {
    render(<Carousel slides={slides} />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
  });

  it('labels the viewport region with the slide count', () => {
    render(<Carousel slides={slides} />);
    expect(screen.getByRole('region', { name: 'Slide 1 of 3' })).toBeInTheDocument();
  });

  it('renders indicator buttons for each slide', () => {
    render(<Carousel slides={slides} />);
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toBeInTheDocument();
  });

  it('marks the first indicator as aria-current', () => {
    render(<Carousel slides={slides} />);
    expect(screen.getByRole('button', { name: 'Go to slide 1' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).not.toHaveAttribute('aria-current');
  });

  it('hides non-active slides with aria-hidden', () => {
    render(<Carousel slides={slides} />);
    const groups = screen.getAllByRole('group', { hidden: true });
    const hidden = groups.filter((g) => g.getAttribute('aria-hidden') === 'true');
    expect(hidden).toHaveLength(2);
  });

  it('shows empty state when slides array is empty', () => {
    render(<Carousel slides={[]} />);
    expect(screen.getByText('Add at least one slide.')).toBeInTheDocument();
  });

  // ─── Navigation ──────────────────────────────────────────────────────────

  // ─── Keyboard navigation ─────────────────────────────────────────────────

  it('ArrowRight advances to the next slide when a control has focus', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} />);
    screen.getByRole('button', { name: 'Next slide' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('region', { name: 'Slide 2 of 3' })).toBeInTheDocument();
  });

  it('ArrowLeft goes to the previous slide when a control has focus', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} initialIndex={1} />);
    screen.getByRole('button', { name: 'Previous slide' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('region', { name: 'Slide 1 of 3' })).toBeInTheDocument();
  });

  it('advances to the next slide when Next is clicked', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('region', { name: 'Slide 2 of 3' })).toBeInTheDocument();
  });

  it('goes back to the previous slide when Previous is clicked', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} initialIndex={1} />);
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(screen.getByRole('region', { name: 'Slide 1 of 3' })).toBeInTheDocument();
  });

  it('jumps to a slide when its indicator is clicked', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} />);
    await user.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(screen.getByRole('region', { name: 'Slide 3 of 3' })).toBeInTheDocument();
  });

  it('calls onIndexChange with the new index on navigation', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<Carousel slides={slides} onIndexChange={onIndexChange} />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('respects initialIndex prop', () => {
    render(<Carousel slides={slides} initialIndex={2} />);
    expect(screen.getByRole('region', { name: 'Slide 3 of 3' })).toBeInTheDocument();
  });

  // ─── Wrapping (loop) ─────────────────────────────────────────────────────

  it('wraps from last to first when loop=true and Next is clicked', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} initialIndex={2} loop />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('region', { name: 'Slide 1 of 3' })).toBeInTheDocument();
  });

  it('wraps from first to last when loop=true and Previous is clicked', async () => {
    const user = userEvent.setup();
    render(<Carousel slides={slides} initialIndex={0} loop />);
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(screen.getByRole('region', { name: 'Slide 3 of 3' })).toBeInTheDocument();
  });

  it('disables Next at the last slide when loop=false', () => {
    render(<Carousel slides={slides} initialIndex={2} loop={false} />);
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });

  it('disables Previous at the first slide when loop=false', () => {
    render(<Carousel slides={slides} initialIndex={0} loop={false} />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
  });

  it('does not disable nav buttons mid-range when loop=false', () => {
    render(<Carousel slides={slides} initialIndex={1} loop={false} />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).not.toBeDisabled();
  });

  // ─── Single slide ────────────────────────────────────────────────────────

  it('disables both nav buttons when there is only one slide', () => {
    render(<Carousel slides={[<div key="1">Only</div>]} />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
  });
});
