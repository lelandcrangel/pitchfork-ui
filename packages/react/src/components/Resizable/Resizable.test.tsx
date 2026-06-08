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
