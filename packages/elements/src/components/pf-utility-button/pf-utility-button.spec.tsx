import { describe, expect, it, render, vi } from '@stencil/vitest';
import './pf-utility-button';

const button = (root: HTMLElement) => root.shadowRoot?.querySelector('button');

describe('pf-utility-button', () => {
  it('renders a real button, defaulting to type=button', async () => {
    const { root } = await render(`<pf-utility-button>Archive</pf-utility-button>`);

    expect(button(root)?.tagName).toBe('BUTTON');
    expect(button(root)?.getAttribute('type')).toBe('button');
  });

  it('reflects variant and size for the stylesheet', async () => {
    const plain = await render(`<pf-utility-button>Go</pf-utility-button>`);
    expect(plain.root.getAttribute('variant')).toBe('neutral');
    expect(plain.root.getAttribute('size')).toBe('md');

    const { root } = await render(
      `<pf-utility-button variant="destructive" size="sm">Go</pf-utility-button>`,
    );
    expect(root.getAttribute('variant')).toBe('destructive');
    expect(root.getAttribute('size')).toBe('sm');
  });

  it('disables the native button, not just the host', async () => {
    const { root } = await render(`<pf-utility-button disabled>Go</pf-utility-button>`);

    expect(button(root)?.hasAttribute('disabled')).toBe(true);
  });

  it('names an icon-only button from the label prop', async () => {
    const { root } = await render(
      `<pf-utility-button label="Delete row"><span slot="icon">x</span></pf-utility-button>`,
    );

    expect(button(root)?.getAttribute('aria-label')).toBe('Delete row');
  });

  it('uses the label as the tooltip unless one is given', async () => {
    const fromLabel = await render(`<pf-utility-button label="Delete"></pf-utility-button>`);
    expect(button(fromLabel.root)?.getAttribute('title')).toBe('Delete');

    const { root } = await render(
      `<pf-utility-button label="Delete" tooltip="Delete permanently"></pf-utility-button>`,
    );
    expect(button(root)?.getAttribute('title')).toBe('Delete permanently');
  });

  /*
   * The slots are the flex items. A wrapper span around each would be a
   * zero-width item that the button's `gap` still spaces, so an icon-only
   * button would carry a stray gap. Verified in a real browser: an icon-only
   * md button measures exactly 42px (16 icon + 24 padding + 2 border).
   */
  it('puts both slots directly in the button, with no wrapper elements', async () => {
    const { root } = await render(`<pf-utility-button>Archive</pf-utility-button>`);
    const children = Array.from(button(root)?.children ?? []);

    expect(children.map((child) => child.tagName.toLowerCase())).toEqual(['slot', 'slot']);
    expect(children.map((child) => child.getAttribute('name'))).toEqual(['icon', null]);
  });

  it('warns when an icon-only button has no accessible name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await render(`<pf-utility-button><span slot="icon">x</span></pf-utility-button>`);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no accessible name'));
    warn.mockRestore();
  });

  it('stays quiet when the button has a visible label', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await render(`<pf-utility-button>Archive</pf-utility-button>`);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('stays quiet when an icon-only button carries aria-label itself', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await render(
      `<pf-utility-button aria-label="Delete"><span slot="icon">x</span></pf-utility-button>`,
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  /*
   * Per element, not per page: a module-level flag would make the warning
   * depend on render order, and would make the two assertions above pass
   * whenever something else had already warned.
   */
  it('warns for every nameless button, not just the first', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await render(`<pf-utility-button><span slot="icon">a</span></pf-utility-button>`);
    await render(`<pf-utility-button><span slot="icon">b</span></pf-utility-button>`);

    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
