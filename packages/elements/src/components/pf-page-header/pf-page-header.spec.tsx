/**
 * The three header elements are markup and hidden boxes, which the fast
 * project can see in full. `slotchange` is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-page-header';
import '../pf-section-header/pf-section-header';
import '../pf-section-footer/pf-section-footer';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const isEmpty = (root: HTMLElement, name: string) =>
  part(root, name)?.classList.contains('empty') ?? null;
const hasSlot = (root: HTMLElement, name: string) =>
  Boolean(root.shadowRoot?.querySelector(`slot[name="${name}"]`));

describe('pf-page-header', () => {
  it('renders the title as the page’s h1', async () => {
    const { root } = await render(`<pf-page-header>Orders</pf-page-header>`);

    expect(part(root, 'heading')?.tagName.toLowerCase()).toBe('h1');
    expect(root.textContent?.trim()).toBe('Orders');
  });

  /*
   * Hidden rather than left out, every one: a slot that is not rendered never
   * fires `slotchange`, so a trail or an action added later would stay
   * invisible for good.
   */
  it('keeps every optional box in the tree, hidden', async () => {
    const { root } = await render(`<pf-page-header>Orders</pf-page-header>`);

    for (const name of ['breadcrumbs', 'metadata', 'actions']) {
      expect(isEmpty(root, name)).toBe(true);
      expect(hasSlot(root, name)).toBe(true);
    }
  });

  it('draws the boxes that have something in them', async () => {
    const { root } = await render(`
      <pf-page-header>
        <pf-breadcrumbs slot="breadcrumbs"></pf-breadcrumbs>
        <span slot="eyebrow">Shop</span>
        Orders
        <span slot="description">Everything bought this month.</span>
        <span slot="metadata">24 orders</span>
        <button slot="actions" type="button">Export</button>
      </pf-page-header>`);

    expect(isEmpty(root, 'breadcrumbs')).toBe(false);
    expect(isEmpty(root, 'metadata')).toBe(false);
    expect(isEmpty(root, 'actions')).toBe(false);
  });

  /*
   * The eyebrow and the description carry no layout, so they get no box: an
   * unassigned slot generates nothing, where an empty wrapper would leave the
   * grid's gap behind it.
   */
  it('gives the eyebrow and description no wrapper', async () => {
    const { root } = await render(`<pf-page-header>Orders</pf-page-header>`);

    expect(part(root, 'eyebrow')).toBeNull();
    expect(part(root, 'description')).toBeNull();
    expect(hasSlot(root, 'eyebrow')).toBe(true);
    expect(hasSlot(root, 'description')).toBe(true);
  });
});

describe('pf-section-header', () => {
  it('renders the heading as an h2', async () => {
    const { root } = await render(`<pf-section-header>Recent activity</pf-section-header>`);
    expect(part(root, 'heading')?.tagName.toLowerCase()).toBe('h2');
  });

  it('has no divider by default, and takes one', async () => {
    const { root: plain } = await render(`<pf-section-header>Activity</pf-section-header>`);
    expect(plain.hasAttribute('divider')).toBe(false);

    const { root: ruled } = await render(`<pf-section-header divider>Activity</pf-section-header>`);
    expect(ruled.hasAttribute('divider')).toBe(true);
  });

  it('defaults to the between alignment', async () => {
    const { root } = await render(`<pf-section-header>Activity</pf-section-header>`);
    expect(root.getAttribute('align')).toBe('between');
  });

  it('hides the metadata and action boxes until they are filled', async () => {
    const { root: bare } = await render(`<pf-section-header>Activity</pf-section-header>`);
    expect(isEmpty(bare, 'metadata')).toBe(true);
    expect(isEmpty(bare, 'actions')).toBe(true);

    const { root: filled } = await render(`
      <pf-section-header>
        Activity
        <span slot="metadata">Updated today</span>
        <button slot="actions" type="button">Refresh</button>
      </pf-section-header>`);
    expect(isEmpty(filled, 'metadata')).toBe(false);
    expect(isEmpty(filled, 'actions')).toBe(false);
  });
});

describe('pf-section-footer', () => {
  it('renders the heading as an h3', async () => {
    const { root } = await render(`<pf-section-footer>Next steps</pf-section-footer>`);
    expect(part(root, 'heading')?.tagName.toLowerCase()).toBe('h3');
  });

  /* The rule is the point of a footer, so it is on by default here. */
  it('has a divider by default', async () => {
    const { root } = await render(`<pf-section-footer>Next steps</pf-section-footer>`);
    expect(root.hasAttribute('divider')).toBe(true);
  });

  it('can drop the divider', async () => {
    const { root } = await render(
      `<pf-section-footer divider="false">Next steps</pf-section-footer>`,
    );
    expect(root.hasAttribute('divider')).toBe(false);
  });

  /*
   * Unlike the headers, the heading here is optional — a footer of nothing but
   * actions is an ordinary thing — so its box is one of the ones that can be
   * empty. The default slot is what fills it, which means counting a bare text
   * node as well as an element.
   */
  it('hides the heading box when there is no heading', async () => {
    const { root: actionsOnly } = await render(`
      <pf-section-footer>
        <button slot="actions" type="button">Save</button>
      </pf-section-footer>`);
    expect(isEmpty(actionsOnly, 'heading')).toBe(true);
    expect(isEmpty(actionsOnly, 'actions')).toBe(false);

    const { root: withText } = await render(`<pf-section-footer>Next steps</pf-section-footer>`);
    expect(isEmpty(withText, 'heading')).toBe(false);

    const { root: withElement } = await render(
      `<pf-section-footer><span>Next steps</span></pf-section-footer>`,
    );
    expect(isEmpty(withElement, 'heading')).toBe(false);
  });
});
