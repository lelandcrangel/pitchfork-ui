import { afterEach, describe, expect, it, vi } from 'vitest';
import { animationsFinished, prefersReducedMotion } from './motion';

describe('prefersReducedMotion', () => {
  const original = window.matchMedia;

  afterEach(() => {
    window.matchMedia = original;
  });

  it('reads the media query', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;
    expect(prefersReducedMotion()).toBe(true);
  });

  it('reports no preference when there is no matchMedia', () => {
    window.matchMedia = undefined as never;
    expect(prefersReducedMotion()).toBe(false);
  });
});

describe('animationsFinished', () => {
  /*
   * The case an `animationend` listener hangs on for ever, and the one that
   * actually happens: reduced motion, a stylesheet that never loaded, or a
   * test project that applies none.
   */
  it('resolves straight away when nothing is animating', async () => {
    const element = document.createElement('div');
    element.getAnimations = () => [];

    await expect(animationsFinished(element)).resolves.toBeUndefined();
  });

  it('resolves for an element that cannot be asked', async () => {
    await expect(animationsFinished(null)).resolves.toBeUndefined();
    await expect(animationsFinished(document.createElement('div'))).resolves.toBeUndefined();
  });

  it('waits for a running animation', async () => {
    let settle = () => {};
    const finished = new Promise<void>((resolve) => {
      settle = resolve;
    });
    const element = document.createElement('div');
    element.getAnimations = () => [{ playState: 'running', finished } as unknown as Animation];

    let done = false;
    const waiting = animationsFinished(element).then(() => {
      done = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(done).toBe(false);

    settle();
    await waiting;
    expect(done).toBe(true);
  });

  it('ignores an animation that has already finished', async () => {
    const element = document.createElement('div');
    element.getAnimations = () => [
      { playState: 'finished', finished: new Promise(() => {}) } as unknown as Animation,
    ];

    await expect(animationsFinished(element)).resolves.toBeUndefined();
  });

  /* A cancelled animation rejects, and that is still "done leaving". */
  it('treats a cancelled animation as finished', async () => {
    const element = document.createElement('div');
    element.getAnimations = () => [
      {
        playState: 'running',
        finished: Promise.reject(new Error('cancelled')),
      } as unknown as Animation,
    ];

    await expect(animationsFinished(element)).resolves.toBeUndefined();
  });
});
