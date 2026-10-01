import { describe, expect, it, render } from '@stencil/vitest';
import './pf-card';
import '../pf-card-header/pf-card-header';
import '../pf-card-content/pf-card-content';
import '../pf-card-footer/pf-card-footer';

describe('pf-card', () => {
  it('renders its slotted sections', async () => {
    const { root } = await render(`
      <pf-card>
        <pf-card-header>Title</pf-card-header>
        <pf-card-content>Body</pf-card-content>
        <pf-card-footer>Actions</pf-card-footer>
      </pf-card>
    `);

    expect(root.querySelector('pf-card-header')?.textContent).toBe('Title');
    expect(root.querySelector('pf-card-content')?.textContent).toBe('Body');
    expect(root.querySelector('pf-card-footer')?.textContent).toBe('Actions');
  });

  it('is a plain grouping element, with no role of its own to announce', async () => {
    const { root } = await render(`<pf-card><pf-card-content>Body</pf-card-content></pf-card>`);

    expect(root.getAttribute('role')).toBeNull();
    expect(root.shadowRoot?.querySelector('slot')).not.toBeNull();
  });

  it('accepts a section on its own, so a card need not use all three', async () => {
    const { root } = await render(`<pf-card><pf-card-content>Body</pf-card-content></pf-card>`);

    expect(root.querySelector('pf-card-header')).toBeNull();
    expect(root.querySelector('pf-card-footer')).toBeNull();
    expect(root.textContent?.trim()).toBe('Body');
  });

  it('lets each section be hidden independently', async () => {
    const { root } = await render(`
      <pf-card>
        <pf-card-header hidden>Title</pf-card-header>
        <pf-card-content>Body</pf-card-content>
      </pf-card>
    `);

    expect(root.querySelector('pf-card-header')?.hasAttribute('hidden')).toBe(true);
    expect(root.querySelector('pf-card-content')?.hasAttribute('hidden')).toBe(false);
  });
});
