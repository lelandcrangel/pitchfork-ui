import { describe, expect, it } from 'vitest';
import { composeDescribedBy, liveRegionRole, type LiveRegionVariant } from './aria';

describe('composeDescribedBy', () => {
  it('joins the ids it is given', () => {
    expect(composeDescribedBy('a', 'b')).toBe('a b');
  });

  it('drops the absent ones rather than leaving holes', () => {
    expect(composeDescribedBy('a', false, null, undefined, 'b')).toBe('a b');
  });

  /* undefined, not '', so the attribute is omitted rather than set empty. */
  it('is undefined when nothing survives', () => {
    expect(composeDescribedBy(false, null, undefined)).toBeUndefined();
  });
});

describe('liveRegionRole', () => {
  it('is polite for the two that are not failures', () => {
    expect(liveRegionRole('info')).toBe('status');
    expect(liveRegionRole('success')).toBe('status');
  });

  /*
   * Assertive interrupts the screen reader mid-sentence, which is the point
   * for these two and a rudeness for the other two.
   */
  it('is assertive for warning and danger', () => {
    expect(liveRegionRole('warning')).toBe('alert');
    expect(liveRegionRole('danger')).toBe('alert');
  });

  it('returns one of the two live-region roles for every variant', () => {
    const variants: LiveRegionVariant[] = ['info', 'success', 'warning', 'danger'];
    for (const variant of variants) {
      expect(['alert', 'status']).toContain(liveRegionRole(variant));
    }
  });
});
