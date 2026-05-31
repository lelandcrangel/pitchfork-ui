import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tooltip } from './Tooltip';

// Helper: get the trigger wrapper span (events live on it, not the child)
const getTrigger = (name: string) =>
  screen.getByRole('button', { name }).parentElement as HTMLElement;

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ─── Show / hide ─────────────────────────────────────────────────────────

  it('does not show the tooltip before the delay elapses', () => {
    render(
      <Tooltip content="Tip" delay={200}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getTrigger('Trigger'));
    act(() => { vi.advanceTimersByTime(199); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip after the delay elapses', () => {
    render(
      <Tooltip content="Tip" delay={200}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getTrigger('Trigger'));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('shows the tooltip immediately when delay is 0', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getTrigger('Trigger'));
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides the tooltip on mouseleave', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = getTrigger('Trigger');
    fireEvent.mouseEnter(trigger);
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows the tooltip on focus', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    fireEvent.focus(getTrigger('Trigger'));
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides the tooltip on blur', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = getTrigger('Trigger');
    fireEvent.focus(trigger);
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('hides the tooltip on Escape key', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = getTrigger('Trigger');
    fireEvent.mouseEnter(trigger);
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('cancels a pending delay if mouseleave fires before it elapses', () => {
    render(
      <Tooltip content="Tip" delay={300}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = getTrigger('Trigger');
    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.mouseLeave(trigger);
    act(() => { vi.runAllTimers(); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── ARIA ────────────────────────────────────────────────────────────────

  it('renders with role=tooltip', () => {
    render(
      <Tooltip content="Helpful text" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getTrigger('Trigger'));
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful text');
  });

  it('sets aria-describedby on the trigger span when the tooltip is visible', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = getTrigger('Trigger');
    expect(trigger).not.toHaveAttribute('aria-describedby');
    fireEvent.mouseEnter(trigger);
    act(() => { vi.runAllTimers(); });
    const tooltipId = screen.getByRole('tooltip').id;
    expect(trigger).toHaveAttribute('aria-describedby', tooltipId);
  });

  it('removes aria-describedby when the tooltip is hidden', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    const trigger = getTrigger('Trigger');
    fireEvent.mouseEnter(trigger);
    act(() => { vi.runAllTimers(); });
    fireEvent.mouseLeave(trigger);
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  // ─── Controlled mode ─────────────────────────────────────────────────────

  it('shows the tooltip when open=true (controlled)', () => {
    render(
      <Tooltip content="Controlled tip" open>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('hides the tooltip when open=false (controlled)', () => {
    render(
      <Tooltip content="Controlled tip" open={false}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not open on mouseenter in controlled mode', () => {
    render(
      <Tooltip content="Tip" open={false} delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getTrigger('Trigger'));
    act(() => { vi.runAllTimers(); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── Disabled ────────────────────────────────────────────────────────────

  it('does not show when disabled', () => {
    render(
      <Tooltip content="Tip" delay={0} disabled>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(getTrigger('Trigger'));
    act(() => { vi.runAllTimers(); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ─── Viewport clipping ───────────────────────────────────────────────────

  it('keeps the tooltip visible when the preferred placement would leave the viewport', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 300 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 200 });

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function getBoundingClientRect(this: HTMLElement) {
        if (this.classList.contains('pf-tooltip')) {
          return new DOMRect(0, 0, 120, 40);
        }
        return new DOMRect(0, 0, 0, 0);
      },
    );

    render(
      <Tooltip content="Edge tooltip" delay={0} placement="left">
        <button type="button">Edge trigger</button>
      </Tooltip>,
    );

    const trigger = getTrigger('Edge trigger');
    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(4, 80, 80, 32),
    );

    fireEvent.mouseEnter(trigger);
    act(() => { vi.runAllTimers(); });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveClass('pf-tooltip--right');
    expect(Number.parseFloat(tooltip.style.left)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(tooltip.style.left) + 120).toBeLessThanOrEqual(292);
    expect(Number.parseFloat(tooltip.style.top) + 40).toBeLessThanOrEqual(192);
  });
});
