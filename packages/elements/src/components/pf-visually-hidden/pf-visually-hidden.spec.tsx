import { describe, expect, it, render } from '@stencil/vitest';
import './pf-visually-hidden';

describe('pf-visually-hidden', () => {
  it('keeps its content in the accessibility tree rather than removing it', async () => {
    const { root } = await render(`<pf-visually-hidden>Loading results</pf-visually-hidden>`);

    expect(root.textContent).toBe('Loading results');
    expect(root.hasAttribute('hidden')).toBe(false);
    expect(root.getAttribute('aria-hidden')).toBeNull();
  });

  it('is not focusable by default', async () => {
    const { root } = await render(`<pf-visually-hidden>Skip</pf-visually-hidden>`);

    expect(root.hasAttribute('focusable')).toBe(false);
  });

  it('reflects focusable so the reveal-on-focus rule can select on it', async () => {
    const { root } = await render(`<pf-visually-hidden focusable>Skip</pf-visually-hidden>`);

    expect(root.getAttribute('focusable')).toBe('');
  });
});
