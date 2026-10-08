import { describe, expect, it, render } from '@stencil/vitest';
import './pf-loading-skeleton';

const dims = (root: HTMLElement) => ({
  width: root.style.getPropertyValue('--pf-skeleton-width'),
  height: root.style.getPropertyValue('--pf-skeleton-height'),
});

describe('pf-loading-skeleton', () => {
  it('is a polite live region with text to announce', async () => {
    const { root } = await render(`<pf-loading-skeleton></pf-loading-skeleton>`);

    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-label')).toBe('Loading content');
    expect(root.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe('Loading content');
  });

  it('defaults to a full-width 16px bar', async () => {
    const { root } = await render(`<pf-loading-skeleton></pf-loading-skeleton>`);

    expect(dims(root)).toEqual({ width: '100%', height: '16px' });
  });

  /*
   * The attribute form is the one that can go wrong: an attribute is always a
   * string, so a bare `width="120"` would otherwise reach CSS as an invalid
   * unitless length and be dropped.
   */
  it('reads a bare numeric attribute as pixels', async () => {
    const { root } = await render(
      `<pf-loading-skeleton width="120" height="8"></pf-loading-skeleton>`,
    );

    expect(dims(root)).toEqual({ width: '120px', height: '8px' });
  });

  it('passes a length that already has a unit straight through', async () => {
    const { root } = await render(
      `<pf-loading-skeleton width="50%" height="2rem"></pf-loading-skeleton>`,
    );

    expect(dims(root)).toEqual({ width: '50%', height: '2rem' });
  });

  it('tolerates a decimal and surrounding whitespace', async () => {
    const { root } = await render(`<pf-loading-skeleton width=" 12.5 "></pf-loading-skeleton>`);

    expect(dims(root).width).toBe('12.5px');
  });

  it('reflects rounded so the stylesheet can swap the radius', async () => {
    const plain = await render(`<pf-loading-skeleton></pf-loading-skeleton>`);
    expect(plain.root.hasAttribute('rounded')).toBe(false);

    const { root } = await render(`<pf-loading-skeleton rounded></pf-loading-skeleton>`);
    expect(root.getAttribute('rounded')).toBe('');
  });
});
