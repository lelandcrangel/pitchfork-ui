import { describe, expect, it, render } from '@stencil/vitest';
import './pf-badge-group';

const parts = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.children ?? []).map((child) => child.getAttribute('part'));

describe('pf-badge-group', () => {
  it('renders the label and the message', async () => {
    const { root } = await render(
      `<pf-badge-group label="2 new" message="See what changed"></pf-badge-group>`,
    );

    expect(root.shadowRoot?.querySelector('[part="badge"]')?.textContent).toBe('2 new');
    expect(root.shadowRoot?.querySelector('[part="text"]')?.textContent).toBe('See what changed');
  });

  /*
   * DOM order, not `flex-direction: row-reverse`: a screen reader reads source
   * order, so reversing visually only would announce the two halves backwards.
   */
  it('puts the badge first when leading and last when trailing', async () => {
    const leading = await render(`<pf-badge-group label="a" message="b"></pf-badge-group>`);
    expect(parts(leading.root)).toEqual(['badge', 'text']);

    const { root } = await render(
      `<pf-badge-group label="a" message="b" badge-position="trailing"></pf-badge-group>`,
    );
    expect(parts(root)).toEqual(['text', 'badge']);
  });

  /*
   * The stylesheet selects on the kebab-cased attribute, which is what Stencil
   * reflects a camelCase prop as. Asserted because a mismatch here is silent:
   * the element renders perfectly and simply loses its joined outline.
   */
  it('reflects badgePosition as the badge-position attribute', async () => {
    const plain = await render(`<pf-badge-group label="a" message="b"></pf-badge-group>`);
    expect(plain.root.getAttribute('badge-position')).toBe('leading');

    const { root } = await render(
      `<pf-badge-group label="a" message="b" badge-position="trailing"></pf-badge-group>`,
    );
    expect(root.getAttribute('badge-position')).toBe('trailing');
  });

  it('reflects color and appearance for the stylesheet', async () => {
    const plain = await render(`<pf-badge-group label="a" message="b"></pf-badge-group>`);
    expect(plain.root.getAttribute('color')).toBe('gray');
    expect(plain.root.getAttribute('appearance')).toBe('pill');

    const { root } = await render(
      `<pf-badge-group label="a" message="b" color="success" appearance="modern"></pf-badge-group>`,
    );
    expect(root.getAttribute('color')).toBe('success');
    expect(root.getAttribute('appearance')).toBe('modern');
  });
});
