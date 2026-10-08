import { describe, expect, it, render } from '@stencil/vitest';
import './pf-scroll-area';

describe('pf-scroll-area', () => {
  it('renders its slotted content', async () => {
    const { root } = await render(`<pf-scroll-area><p>Tall</p></pf-scroll-area>`);

    expect(root.querySelector('p')?.textContent).toBe('Tall');
  });

  it('reflects orientation, which is what switches the overflow axes', async () => {
    const plain = await render(`<pf-scroll-area></pf-scroll-area>`);
    expect(plain.root.getAttribute('orientation')).toBe('vertical');

    const { root } = await render(`<pf-scroll-area orientation="both"></pf-scroll-area>`);
    expect(root.getAttribute('orientation')).toBe('both');
  });

  /*
   * The host is the scroll container, so the host is what has to take focus for
   * arrow-key scrolling (WCAG 2.1.1). There is no inner element to hold it.
   */
  it('makes itself keyboard-focusable by default', async () => {
    const { root } = await render(`<pf-scroll-area></pf-scroll-area>`);

    expect(root.getAttribute('tabindex')).toBe('0');
  });

  it('adds no tabindex when a focusable child already provides access', async () => {
    const { root } = await render(`<pf-scroll-area focusable="false"></pf-scroll-area>`);

    expect(root.hasAttribute('tabindex')).toBe(false);
  });

  it("respects a consumer's own tabindex instead of resetting it", async () => {
    const { root } = await render(`<pf-scroll-area tabindex="-1"></pf-scroll-area>`);

    expect(root.getAttribute('tabindex')).toBe('-1');
  });
});
