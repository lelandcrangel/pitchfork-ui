import { describe, expect, it, render } from '@stencil/vitest';
import './pf-badge';

describe('pf-badge', () => {
  it('renders its slotted content', async () => {
    const { root } = await render(`<pf-badge>Shipped</pf-badge>`);

    expect(root.textContent).toBe('Shipped');
  });

  it('defaults to the neutral variant, reflected for the stylesheet', async () => {
    const { root } = await render(`<pf-badge>Shipped</pf-badge>`);

    expect(root.getAttribute('variant')).toBe('neutral');
  });

  it('reflects an explicit variant', async () => {
    const { root } = await render(`<pf-badge variant="danger">Failed</pf-badge>`);

    expect(root.getAttribute('variant')).toBe('danger');
  });
});
