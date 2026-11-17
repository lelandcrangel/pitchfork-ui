import { describe, expect, it, render } from '@stencil/vitest';
import './pf-toolbar-separator';

describe('pf-toolbar-separator', () => {
  it('announces itself as a separator', async () => {
    const { root } = await render(`<pf-toolbar-separator></pf-toolbar-separator>`);

    expect(root.getAttribute('role')).toBe('separator');
  });

  /*
   * `orientation` names the toolbar's axis, not the rule's own: a horizontal
   * toolbar is divided by a vertical hairline. `aria-orientation` is ARIA's,
   * and ARIA's describes the separator itself -- so the two read opposite
   * ways. This test used to assert they matched, which announced every
   * separator rotated by ninety degrees.
   */
  it('announces its own orientation, across the toolbar it was given', async () => {
    const plain = await render(`<pf-toolbar-separator></pf-toolbar-separator>`);
    expect(plain.root.getAttribute('orientation')).toBe('horizontal');
    expect(plain.root.getAttribute('aria-orientation')).toBe('vertical');

    const { root } = await render(
      `<pf-toolbar-separator orientation="vertical"></pf-toolbar-separator>`,
    );
    expect(root.getAttribute('orientation')).toBe('vertical');
    expect(root.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('has no content of its own to announce', async () => {
    const { root } = await render(`<pf-toolbar-separator></pf-toolbar-separator>`);

    expect(root.shadowRoot?.textContent?.trim()).toBe('');
  });
});
