import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFocusableElements, trapFocus } from './focus';

let container: HTMLElement;

beforeEach(() => {
  // jsdom has no layout: offsetParent is always null and getClientRects() is
  // always empty, so every element would read as hidden. Pretend elements are
  // laid out — the same stand-in the React suite uses.
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  container.remove();
  vi.restoreAllMocks();
});

const tab = (shiftKey = false) => {
  // cancelable, or preventDefault() is a silent no-op and the trap looks broken.
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
};

describe('getFocusableElements', () => {
  it('finds the usual focusable elements in source order', () => {
    container.innerHTML = `
      <a href="#one">one</a>
      <button>two</button>
      <input />
      <textarea></textarea>
      <select></select>
      <div tabindex="0">six</div>
    `;
    expect(getFocusableElements(container)).toHaveLength(6);
  });

  it('skips disabled controls', () => {
    container.innerHTML = '<button>ok</button><button disabled>no</button>';
    expect(getFocusableElements(container).map((el) => el.textContent)).toEqual(['ok']);
  });

  it('skips aria-hidden elements', () => {
    container.innerHTML = '<button>ok</button><button aria-hidden="true">no</button>';
    expect(getFocusableElements(container).map((el) => el.textContent)).toEqual(['ok']);
  });

  it('skips tabindex="-1"', () => {
    container.innerHTML = '<div tabindex="0">ok</div><div tabindex="-1">no</div>';
    expect(getFocusableElements(container).map((el) => el.textContent)).toEqual(['ok']);
  });

  it('treats contenteditable="false" as not editable', () => {
    container.innerHTML = '<div contenteditable>ok</div><div contenteditable="false">no</div>';
    expect(getFocusableElements(container).map((el) => el.textContent)).toEqual(['ok']);
  });
});

describe('trapFocus', () => {
  it('focuses the first focusable element on install', () => {
    container.innerHTML = '<button id="first">first</button><button id="last">last</button>';
    const release = trapFocus({ getContainer: () => container });
    expect(document.activeElement?.id).toBe('first');
    release();
  });

  it('falls back to the container when nothing inside is focusable', () => {
    container.tabIndex = -1;
    const focus = vi.spyOn(container, 'focus');
    const release = trapFocus({ getContainer: () => container });
    expect(focus).toHaveBeenCalled();
    release();
  });

  it('cycles from the last element back to the first', () => {
    container.innerHTML = '<button id="first">first</button><button id="last">last</button>';
    const release = trapFocus({ getContainer: () => container });
    container.querySelector<HTMLElement>('#last')!.focus();

    const event = tab();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('first');
    release();
  });

  it('cycles backward from the first element to the last', () => {
    container.innerHTML = '<button id="first">first</button><button id="last">last</button>';
    const release = trapFocus({ getContainer: () => container });

    const event = tab(true);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe('last');
    release();
  });

  it('pulls focus back in when it has escaped the container', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    container.innerHTML = '<button id="first">first</button><button id="last">last</button>';
    const release = trapFocus({ getContainer: () => container });
    outside.focus();

    tab();
    expect(document.activeElement?.id).toBe('first');
    release();
    outside.remove();
  });

  it('calls onEscape and leaves focus alone', () => {
    container.innerHTML = '<button id="first">first</button>';
    const onEscape = vi.fn();
    const release = trapFocus({ getContainer: () => container, onEscape });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onEscape).toHaveBeenCalledOnce();
    release();
  });

  it('restores focus to the previously active element on release', () => {
    const before = document.createElement('button');
    document.body.appendChild(before);
    before.focus();
    container.innerHTML = '<button id="first">first</button>';

    const release = trapFocus({ getContainer: () => container });
    expect(document.activeElement?.id).toBe('first');

    release();
    expect(document.activeElement).toBe(before);
    before.remove();
  });

  it('leaves focus where it is when restoreFocus is false', () => {
    const before = document.createElement('button');
    document.body.appendChild(before);
    before.focus();
    container.innerHTML = '<button id="first">first</button>';

    const release = trapFocus({ getContainer: () => container, restoreFocus: false });
    release();
    expect(document.activeElement?.id).toBe('first');
    before.remove();
  });

  it('stops responding once released', () => {
    container.innerHTML = '<button id="first">first</button><button id="last">last</button>';
    const onEscape = vi.fn();
    const release = trapFocus({ getContainer: () => container, onEscape });
    release();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('reads the container fresh, so a container swapped after install still traps', () => {
    let current: HTMLElement | null = null;
    const release = trapFocus({ getContainer: () => current });

    current = container;
    container.innerHTML = '<button id="first">first</button><button id="last">last</button>';
    container.querySelector<HTMLElement>('#last')!.focus();

    tab();
    expect(document.activeElement?.id).toBe('first');
    release();
  });
});
