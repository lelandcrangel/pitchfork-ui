import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 200,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the tooltip visible when the preferred placement would leave the viewport', () => {
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

    const trigger = screen.getByRole('button', {
      name: 'Edge trigger',
    }).parentElement;

    expect(trigger).toBeInstanceOf(HTMLElement);

    vi.spyOn(trigger as HTMLElement, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(4, 80, 80, 32),
    );

    fireEvent.mouseEnter(trigger as HTMLElement);

    act(() => {
      vi.runAllTimers();
    });

    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveClass('pf-tooltip--right');
    expect(Number.parseFloat(tooltip.style.left)).toBeGreaterThanOrEqual(8);
    expect(Number.parseFloat(tooltip.style.top)).toBeGreaterThanOrEqual(8);
    expect(
      Number.parseFloat(tooltip.style.left) + 120,
    ).toBeLessThanOrEqual(292);
    expect(Number.parseFloat(tooltip.style.top) + 40).toBeLessThanOrEqual(192);
  });
});
