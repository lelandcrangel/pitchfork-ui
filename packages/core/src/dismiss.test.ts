import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onOutsideInteraction } from './dismiss';

let inside: HTMLElement;
let outside: HTMLElement;

beforeEach(() => {
  inside = document.createElement('div');
  inside.innerHTML = '<button>child</button>';
  outside = document.createElement('div');
  document.body.append(inside, outside);
});

afterEach(() => {
  inside.remove();
  outside.remove();
});

const pointerDownOn = (target: Element, type = 'pointerdown') => {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true }));
};

describe('onOutsideInteraction', () => {
  it('fires when the interaction lands outside every container', () => {
    const onInteractOutside = vi.fn();
    const release = onOutsideInteraction({
      getContainers: () => [inside],
      onInteractOutside,
    });

    pointerDownOn(outside);
    expect(onInteractOutside).toHaveBeenCalledOnce();
    release();
  });

  it('stays quiet for an interaction inside a container', () => {
    const onInteractOutside = vi.fn();
    const release = onOutsideInteraction({
      getContainers: () => [inside],
      onInteractOutside,
    });

    pointerDownOn(inside);
    expect(onInteractOutside).not.toHaveBeenCalled();
    release();
  });

  it('counts descendants of a container as inside', () => {
    const onInteractOutside = vi.fn();
    const release = onOutsideInteraction({
      getContainers: () => [inside],
      onInteractOutside,
    });

    pointerDownOn(inside.querySelector('button')!);
    expect(onInteractOutside).not.toHaveBeenCalled();
    release();
  });

  it('treats any of several containers as inside', () => {
    const onInteractOutside = vi.fn();
    const release = onOutsideInteraction({
      getContainers: () => [inside, outside],
      onInteractOutside,
    });

    pointerDownOn(outside);
    expect(onInteractOutside).not.toHaveBeenCalled();
    release();
  });

  it('tolerates containers that are not mounted yet', () => {
    const onInteractOutside = vi.fn();
    const release = onOutsideInteraction({
      getContainers: () => [null, undefined],
      onInteractOutside,
    });

    pointerDownOn(outside);
    expect(onInteractOutside).toHaveBeenCalledOnce();
    release();
  });

  it('can listen for mousedown instead', () => {
    const onInteractOutside = vi.fn();
    const release = onOutsideInteraction({
      getContainers: () => [inside],
      onInteractOutside,
      eventName: 'mousedown',
    });

    pointerDownOn(outside, 'pointerdown');
    expect(onInteractOutside).not.toHaveBeenCalled();

    pointerDownOn(outside, 'mousedown');
    expect(onInteractOutside).toHaveBeenCalledOnce();
    release();
  });

  it('stops listening once released', () => {
    const onInteractOutside = vi.fn();
    const release = onOutsideInteraction({
      getContainers: () => [inside],
      onInteractOutside,
    });
    release();

    pointerDownOn(outside);
    expect(onInteractOutside).not.toHaveBeenCalled();
  });
});
