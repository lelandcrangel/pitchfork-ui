import { describe, expect, it, render } from '@stencil/vitest';
import './pf-loading-dots';

describe('pf-loading-dots', () => {
  it('is a polite live region with text to announce', async () => {
    const { root } = await render(`<pf-loading-dots label="Thinking"></pf-loading-dots>`);

    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-label')).toBe('Thinking');
    expect(root.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe('Thinking');
  });

  it('draws three dots and keeps them out of the accessibility tree', async () => {
    const { root } = await render(`<pf-loading-dots></pf-loading-dots>`);
    const dots = Array.from(root.shadowRoot?.querySelectorAll('[part="dot"]') ?? []);

    expect(dots).toHaveLength(3);
    expect(dots.every((dot) => dot.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('puts the dots before the label, which is what the stagger selectors count on', async () => {
    const { root } = await render(`<pf-loading-dots></pf-loading-dots>`);
    const children = Array.from(root.shadowRoot?.children ?? []);

    expect(children.map((child) => child.getAttribute('part'))).toEqual([
      'dot',
      'dot',
      'dot',
      'label',
    ]);
  });

  it('reflects size for the stylesheet', async () => {
    const plain = await render(`<pf-loading-dots></pf-loading-dots>`);
    expect(plain.root.getAttribute('size')).toBe('md');

    const { root } = await render(`<pf-loading-dots size="lg"></pf-loading-dots>`);
    expect(root.getAttribute('size')).toBe('lg');
  });
});
