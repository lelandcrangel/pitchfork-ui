import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Toolbar, ToolbarSeparator } from './Toolbar';

function Fixture({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <Toolbar aria-label="Text formatting" orientation={orientation}>
      <button type="button">Bold</button>
      <button type="button">Italic</button>
      <ToolbarSeparator />
      <button type="button">Link</button>
    </Toolbar>
  );
}

describe('Toolbar', () => {
  it('exposes the toolbar role and orientation', () => {
    render(<Fixture />);
    const toolbar = screen.getByRole('toolbar', { name: 'Text formatting' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('sets a single roving tab stop (first item)', () => {
    render(<Fixture />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('tabindex', '0');
    expect(buttons[1]).toHaveAttribute('tabindex', '-1');
    expect(buttons[2]).toHaveAttribute('tabindex', '-1');
  });

  it('moves focus with ArrowRight / ArrowLeft and wraps', () => {
    render(<Fixture />);
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(buttons[1]).toHaveFocus();
    expect(buttons[1]).toHaveAttribute('tabindex', '0');
    expect(buttons[0]).toHaveAttribute('tabindex', '-1');

    // wrap from last back to first
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowRight' });
    expect(buttons[0]).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowLeft' });
    expect(buttons[2]).toHaveFocus();
  });

  it('jumps with Home and End', () => {
    render(<Fixture />);
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'End' });
    expect(buttons[2]).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'Home' });
    expect(buttons[0]).toHaveFocus();
  });

  it('uses Up/Down arrows when vertical', () => {
    render(<Fixture orientation="vertical" />);
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();
    fireEvent.keyDown(screen.getByRole('toolbar'), { key: 'ArrowDown' });
    expect(buttons[1]).toHaveFocus();
  });

  it('renders a separator with role=separator', () => {
    render(<Fixture />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
});
