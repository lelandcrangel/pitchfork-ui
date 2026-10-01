import { describe, expect, it, render } from '@stencil/vitest';
import './pf-button';

const button = (root: HTMLElement) => root.shadowRoot?.querySelector('button') ?? null;

describe('pf-button', () => {
  it('renders a real button carrying the slotted label', async () => {
    const { root } = await render(`<pf-button>Save</pf-button>`);

    expect(button(root)).not.toBeNull();
    expect(button(root)?.getAttribute('type')).toBe('button');
    expect(root.textContent).toBe('Save');
  });

  it('reflects variant and size so the stylesheet can select on them', async () => {
    const { root } = await render(`<pf-button variant="destructive" size="lg">Delete</pf-button>`);

    expect(root.getAttribute('variant')).toBe('destructive');
    expect(root.getAttribute('size')).toBe('lg');
  });

  it('exposes the button and spinner as parts', async () => {
    const { root } = await render(`<pf-button loading>Saving</pf-button>`);

    expect(root.shadowRoot?.querySelector('[part="button"]')).not.toBeNull();
    expect(root.shadowRoot?.querySelector('[part="spinner"]')).not.toBeNull();
  });

  it('marks itself busy and blocks interaction while loading', async () => {
    const { root } = await render(`<pf-button loading>Saving</pf-button>`);

    expect(button(root)?.getAttribute('aria-busy')).toBe('true');
    expect(button(root)?.hasAttribute('disabled')).toBe(true);
  });

  it('is disabled but not busy when merely disabled', async () => {
    const { root } = await render(`<pf-button disabled>Save</pf-button>`);

    expect(button(root)?.hasAttribute('disabled')).toBe(true);
    expect(button(root)?.getAttribute('aria-busy')).toBeNull();
  });

  it('names itself from the label prop, for icon-only use', async () => {
    const { root } = await render(`<pf-button label="Close"></pf-button>`);

    expect(button(root)?.getAttribute('aria-label')).toBe('Close');
  });

  it('honours an explicit submit type', async () => {
    const { root } = await render(`<pf-button type="submit">Send</pf-button>`);

    expect(button(root)?.getAttribute('type')).toBe('submit');
  });
});
