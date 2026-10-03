import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Resizable } from './Resizable';

function Fixture(props: Partial<React.ComponentProps<typeof Resizable>> = {}) {
  return (
    <Resizable {...props}>
      <div>First panel</div>
      <div>Second panel</div>
    </Resizable>
  );
}

describe('Resizable', () => {
  it('renders both panels and a separator handle', () => {
    render(<Fixture />);
    expect(screen.getByText('First panel')).toBeInTheDocument();
    expect(screen.getByText('Second panel')).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Resize panels' })).toBeInTheDocument();
  });

  it('wires up the value/min/max and orientation', () => {
    render(<Fixture defaultSize={40} min={20} max={80} />);
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-valuenow', '40');
    expect(handle).toHaveAttribute('aria-valuemin', '20');
    expect(handle).toHaveAttribute('aria-valuemax', '80');
    // horizontal split → vertical separator
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('resizes with arrow keys (horizontal)', () => {
    const onSizeChange = vi.fn();
    render(<Fixture defaultSize={50} step={5} onSizeChange={onSizeChange} />);
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onSizeChange).toHaveBeenLastCalledWith(55);
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(onSizeChange).toHaveBeenLastCalledWith(50);
  });

  it('jumps to min/max with Home/End', () => {
    const onSizeChange = vi.fn();
    render(<Fixture defaultSize={50} min={15} max={85} onSizeChange={onSizeChange} />);
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'End' });
    expect(onSizeChange).toHaveBeenLastCalledWith(85);
    fireEvent.keyDown(handle, { key: 'Home' });
    expect(onSizeChange).toHaveBeenLastCalledWith(15);
  });

  it('clamps at the bounds', () => {
    const onSizeChange = vi.fn();
    render(<Fixture defaultSize={88} min={10} max={90} step={5} onSizeChange={onSizeChange} />);
    const handle = screen.getByRole('separator');
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(onSizeChange).toHaveBeenLastCalledWith(90);
  });

  /*
   * `NaN` survives arithmetic silently and reaches the DOM as
   * `flex-basis: NaN%`, which is invalid at computed-value time and collapses
   * the panel. Core turns it into an even split of the bounds instead, which
   * is also what `<pf-resizable>` does.
   */
  it('falls back to an even split of the bounds for a size that is not a number', () => {
    render(<Fixture size={Number.NaN} min={20} max={80} />);
    const handle = screen.getByRole('separator');

    expect(handle).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('First panel').parentElement).toHaveStyle({ flexBasis: '50%' });
  });

  /*
   * The arrows of the other axis are not handled at all, so a page still
   * scrolls with a horizontal splitter focused.
   */
  it('leaves the other axis to the page', () => {
    const onSizeChange = vi.fn();
    render(<Fixture defaultSize={50} onSizeChange={onSizeChange} />);
    const handle = screen.getByRole('separator');

    const up = fireEvent.keyDown(handle, { key: 'ArrowUp' });
    const down = fireEvent.keyDown(handle, { key: 'ArrowDown' });

    expect(onSizeChange).not.toHaveBeenCalled();
    // fireEvent returns false when preventDefault was called.
    expect(up).toBe(true);
    expect(down).toBe(true);
  });

  it('uses up/down arrows and a horizontal separator when vertical', () => {
    const onSizeChange = vi.fn();
    render(
      <Fixture orientation="vertical" defaultSize={50} step={10} onSizeChange={onSizeChange} />,
    );
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    expect(onSizeChange).toHaveBeenLastCalledWith(60);
  });
});
