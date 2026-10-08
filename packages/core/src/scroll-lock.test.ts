import { afterEach, describe, expect, it } from 'vitest';
import { lockPageScroll } from './scroll-lock';

const overflow = () => document.documentElement.style.overflow;

afterEach(() => {
  document.documentElement.style.overflow = '';
});

describe('lockPageScroll', () => {
  it('locks on the way in and restores on the way out', () => {
    expect(overflow()).toBe('');
    const release = lockPageScroll();
    expect(overflow()).toBe('hidden');
    release();
    expect(overflow()).toBe('');
  });

  it('restores whatever the page had, not a blank value', () => {
    document.documentElement.style.overflow = 'scroll';
    const release = lockPageScroll();
    expect(overflow()).toBe('hidden');
    release();
    expect(overflow()).toBe('scroll');
  });

  /*
   * The reason for the reference count. Without it the inner lock records
   * `hidden` as the value to restore, and the page never scrolls again.
   */
  it('stays locked until the last of two nested holders releases', () => {
    const outer = lockPageScroll();
    const inner = lockPageScroll();
    expect(overflow()).toBe('hidden');

    inner();
    expect(overflow()).toBe('hidden');

    outer();
    expect(overflow()).toBe('');
  });

  /* Closing in the other order is the same: it is a count, not a stack. */
  it('does not unlock early when the outer holder releases first', () => {
    document.documentElement.style.overflow = 'auto';
    const outer = lockPageScroll();
    const inner = lockPageScroll();

    outer();
    expect(overflow()).toBe('hidden');

    inner();
    expect(overflow()).toBe('auto');
  });

  /*
   * An element removed while open releases from its disconnect callback as
   * well as its close path. A second call must not decrement a count another
   * holder owns.
   */
  it('ignores a repeated release rather than unlocking someone else', () => {
    const first = lockPageScroll();
    const second = lockPageScroll();

    first();
    first();
    first();
    expect(overflow()).toBe('hidden');

    second();
    expect(overflow()).toBe('');
  });

  it('can be locked again after everyone has released', () => {
    lockPageScroll()();
    expect(overflow()).toBe('');
    const release = lockPageScroll();
    expect(overflow()).toBe('hidden');
    release();
    expect(overflow()).toBe('');
  });
});
