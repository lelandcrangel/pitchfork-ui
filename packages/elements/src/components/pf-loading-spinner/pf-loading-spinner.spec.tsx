import { describe, expect, it, render } from '@stencil/vitest';
import './pf-loading-spinner';

describe('pf-loading-spinner', () => {
  it('is a polite live region with an accessible name', async () => {
    const { root } = await render(`<pf-loading-spinner></pf-loading-spinner>`);

    expect(root.getAttribute('role')).toBe('status');
    expect(root.getAttribute('aria-label')).toBe('Loading');
  });

  it('gives the live region text to announce, not just a name', async () => {
    const { root } = await render(`<pf-loading-spinner label="Fetching"></pf-loading-spinner>`);

    expect(root.getAttribute('aria-label')).toBe('Fetching');
    expect(root.shadowRoot?.querySelector('[part="label"]')?.textContent).toBe('Fetching');
  });

  it('sizes itself through a custom property, so the host stays square', async () => {
    const { root } = await render(`<pf-loading-spinner size="40"></pf-loading-spinner>`);

    expect(root.style.getPropertyValue('--pf-spinner-size')).toBe('40px');
  });

  it('defaults to 24px', async () => {
    const { root } = await render(`<pf-loading-spinner></pf-loading-spinner>`);

    expect(root.style.getPropertyValue('--pf-spinner-size')).toBe('24px');
  });
});
