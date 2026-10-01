import { describe, expect, it, render } from '@stencil/vitest';
import './pf-pagination';

const pages = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('.page') ?? []).map((b) => b.textContent);
const gaps = (root: HTMLElement) => root.shadowRoot?.querySelectorAll('[part="ellipsis"]') ?? [];
const nav = (root: HTMLElement, which: 'previous' | 'next') =>
  root.shadowRoot?.querySelector(`[part~="${which}"]`) ?? null;
/*
 * The attribute, not the `disabled` property: Stencil's mock DOM reads
 * `button.disabled` as `undefined` even for a disabled button (see CLAUDE.md).
 */
const isDisabled = (el: Element | null) => el?.hasAttribute('disabled') ?? null;
const currentButton = (root: HTMLElement) =>
  root.shadowRoot?.querySelector('[part~="current"]') ?? null;

describe('pf-pagination', () => {
  it('is a navigation landmark with a name', async () => {
    const { root } = await render(`<pf-pagination total-pages="5"></pf-pagination>`);

    expect(root.getAttribute('role')).toBe('navigation');
    expect(root.getAttribute('aria-label')).toBe('Pagination');
  });

  it('takes a custom landmark name', async () => {
    const { root } = await render(
      `<pf-pagination total-pages="5" label="Search results"></pf-pagination>`,
    );

    expect(root.getAttribute('aria-label')).toBe('Search results');
  });

  it('lists the pages core says to show, with the gaps between them', async () => {
    const { root } = await render(`<pf-pagination total-pages="10" page="5"></pf-pagination>`);

    expect(pages(root)).toEqual(['1', '4', '5', '6', '10']);
    expect(gaps(root)).toHaveLength(2);
  });

  it('marks exactly one page as current, for assistive technology', async () => {
    const { root } = await render(`<pf-pagination total-pages="10" page="5"></pf-pagination>`);

    expect(root.shadowRoot?.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(currentButton(root)?.textContent).toBe('5');
  });

  /* "..." read aloud between page numbers interrupts rather than informs. */
  it('keeps the gaps out of the accessibility tree', async () => {
    const { root } = await render(`<pf-pagination total-pages="10" page="5"></pf-pagination>`);

    expect(Array.from(gaps(root)).every((g) => g.getAttribute('aria-hidden') === 'true')).toBe(
      true,
    );
  });

  it('disables previous on the first page and next on the last', async () => {
    const first = await render(`<pf-pagination total-pages="5" page="1"></pf-pagination>`);
    expect(isDisabled(nav(first.root, 'previous'))).toBe(true);
    expect(isDisabled(nav(first.root, 'next'))).toBe(false);

    const last = await render(`<pf-pagination total-pages="5" page="5"></pf-pagination>`);
    expect(isDisabled(nav(last.root, 'previous'))).toBe(false);
    expect(isDisabled(nav(last.root, 'next'))).toBe(true);
  });

  it('omits the previous/next buttons on request', async () => {
    const { root } = await render(
      `<pf-pagination total-pages="5" show-prev-next="false"></pf-pagination>`,
    );

    expect(nav(root, 'previous')).toBeNull();
    expect(nav(root, 'next')).toBeNull();
  });

  /*
   * Slot fallback is the web-component answer to React's `prevLabel`
   * default: the consumer overrides it by slotting, and gets the text if not.
   */
  it('labels the nav buttons from slot fallback content', async () => {
    const { root } = await render(`<pf-pagination total-pages="5"></pf-pagination>`);

    expect(nav(root, 'previous')?.textContent).toBe('Previous');
    expect(nav(root, 'next')?.textContent).toBe('Next');
    expect(root.shadowRoot?.querySelector('slot[name="previous"]')).not.toBeNull();
  });

  it('clamps a page outside the range rather than rendering nothing', async () => {
    const over = await render(`<pf-pagination total-pages="5" page="99"></pf-pagination>`);
    expect(currentButton(over.root)?.textContent).toBe('5');

    const under = await render(`<pf-pagination total-pages="5" page="0"></pf-pagination>`);
    expect(currentButton(under.root)?.textContent).toBe('1');
  });

  it('always offers a page, even with no pages at all', async () => {
    const { root } = await render(`<pf-pagination total-pages="0"></pf-pagination>`);

    expect(pages(root)).toEqual(['1']);
  });

  it('disables every button when disabled', async () => {
    const { root } = await render(
      `<pf-pagination total-pages="5" page="3" disabled></pf-pagination>`,
    );
    const buttons = Array.from(root.shadowRoot?.querySelectorAll('button') ?? []);

    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons.every((b) => b.hasAttribute('disabled'))).toBe(true);
  });
});
