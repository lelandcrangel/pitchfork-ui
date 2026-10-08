import { describe, expect, it, render } from '@stencil/vitest';
import './pf-avatar';

describe('pf-avatar', () => {
  it('derives initials from the name', async () => {
    const { root } = await render(`<pf-avatar name="Ada Lovelace"></pf-avatar>`);

    expect(root.shadowRoot?.querySelector('[part="fallback"]')?.textContent).toContain('AL');
  });

  it('names itself for assistive technology when it has a name', async () => {
    const { root } = await render(`<pf-avatar name="Ada Lovelace"></pf-avatar>`);

    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Ada Lovelace');
  });

  it('is not an image role without a name', async () => {
    const { root } = await render(`<pf-avatar></pf-avatar>`);

    expect(root.getAttribute('role')).toBeNull();
  });

  it('renders a photo instead of initials when given a src', async () => {
    const { root } = await render(`<pf-avatar src="/a.png" name="Ada Lovelace"></pf-avatar>`);

    expect(root.shadowRoot?.querySelector('[part="image"]')).not.toBeNull();
    expect(root.shadowRoot?.querySelector('[part="fallback"]')).toBeNull();
  });

  it('empties the photo alt when the host already carries the name', async () => {
    const { root } = await render(`<pf-avatar src="/a.png" name="Ada Lovelace"></pf-avatar>`);

    expect(root.shadowRoot?.querySelector('[part="image"]')?.getAttribute('alt')).toBe('');
  });

  it('falls back to a generic alt when there is no name to carry', async () => {
    const { root } = await render(`<pf-avatar src="/a.png"></pf-avatar>`);

    expect(root.shadowRoot?.querySelector('[part="image"]')?.getAttribute('alt')).toBe('Avatar');
  });

  it('shows a decorative status dot only when asked', async () => {
    const plain = await render(`<pf-avatar name="Ada"></pf-avatar>`);
    expect(plain.root.shadowRoot?.querySelector('[part="status"]')).toBeNull();

    const online = await render(`<pf-avatar name="Ada" status="online"></pf-avatar>`);
    const dot = online.root.shadowRoot?.querySelector('[part="status"]');
    expect(dot).not.toBeNull();
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects size and status for the stylesheet', async () => {
    const { root } = await render(`<pf-avatar name="Ada" size="xl" status="busy"></pf-avatar>`);

    expect(root.getAttribute('size')).toBe('xl');
    expect(root.getAttribute('status')).toBe('busy');
  });
});
