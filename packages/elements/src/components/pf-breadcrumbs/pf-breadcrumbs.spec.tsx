/**
 * All of this element is markup and pushed-down state, so the fast project
 * covers it; `slotchange` is the one thing it cannot see, and that is in the
 * browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-breadcrumbs';
import '../pf-breadcrumb/pf-breadcrumb';

const FIXTURE = (attrs = '', crumbs = '') => `
  <pf-breadcrumbs ${attrs}>
    <pf-breadcrumb href="/">Home</pf-breadcrumb>
    <pf-breadcrumb href="/products" ${crumbs}>Products</pf-breadcrumb>
    <pf-breadcrumb>Shoes</pf-breadcrumb>
  </pf-breadcrumbs>`;

const crumbs = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-breadcrumb'));
const link = (crumb: Element) =>
  crumb.shadowRoot?.querySelector('[part="link"]') as HTMLElement | null;
const separator = (crumb: Element) =>
  crumb.shadowRoot?.querySelector('[part="separator"]') as HTMLElement | null;
const currentLabels = (root: HTMLElement) =>
  crumbs(root)
    .filter((crumb) => link(crumb)?.getAttribute('aria-current') === 'page')
    .map((crumb) => crumb.textContent?.trim());

describe('pf-breadcrumbs', () => {
  it('is a navigation landmark with a name', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBe('navigation');
    expect(root.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(root.shadowRoot?.querySelector('[part="list"]')?.tagName.toLowerCase()).toBe('ol');
  });

  it('takes a name of its own', async () => {
    const { root } = await render(FIXTURE('label="Site breadcrumb"'));
    expect(root.getAttribute('aria-label')).toBe('Site breadcrumb');
  });

  it('makes each crumb a list item', async () => {
    const { root } = await render(FIXTURE());
    expect(crumbs(root).every((crumb) => crumb.getAttribute('role') === 'listitem')).toBe(true);
  });

  it('links a crumb with an href and spans one without', async () => {
    const { root } = await render(FIXTURE());
    const [home, , shoes] = crumbs(root);

    expect(link(home)?.tagName.toLowerCase()).toBe('a');
    expect(link(home)?.getAttribute('href')).toBe('/');
    expect(link(shoes)?.tagName.toLowerCase()).toBe('span');
  });

  it('marks the last crumb as the current page', async () => {
    const { root } = await render(FIXTURE());
    expect(currentLabels(root)).toEqual(['Shoes']);
  });

  /*
   * Core's rule, and the reason it is one index: reading `current ?? isLast`
   * per crumb marked the explicit one *and* the last, so a trail claimed two
   * current pages. The React component had exactly that defect.
   */
  it('marks exactly one crumb when a middle one says it is current', async () => {
    const { root } = await render(FIXTURE('', 'current'));
    expect(currentLabels(root)).toEqual(['Products']);
  });

  it('draws a separator after every crumb but the last', async () => {
    const { root } = await render(FIXTURE());
    const [home, products, shoes] = crumbs(root);

    expect(separator(home)?.textContent).toBe('/');
    expect(separator(products)?.textContent).toBe('/');
    expect(separator(shoes)).toBeNull();
    expect(separator(home)?.getAttribute('aria-hidden')).toBe('true');
  });

  /*
   * A string rather than a slot, because a slot renders its content once and
   * the separator has to appear between every pair. Each crumb draws its own.
   */
  it('pushes its own separator down to every crumb', async () => {
    const { root } = await render(FIXTURE('separator=">"'));
    const [home, products] = crumbs(root);

    expect(separator(home)?.textContent).toBe('>');
    expect(separator(products)?.textContent).toBe('>');
  });

  it('marks the only crumb in a trail of one, with no separator', async () => {
    const { root } = await render(`
      <pf-breadcrumbs><pf-breadcrumb>Only</pf-breadcrumb></pf-breadcrumbs>`);

    expect(currentLabels(root)).toEqual(['Only']);
    expect(separator(crumbs(root)[0])).toBeNull();
  });

  it('re-reads the children on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE());

    (crumbs(root)[0] as HTMLElement & { current: boolean }).current = true;
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(currentLabels(root)).toEqual(['Home']);
  });

  /* Writing the answer back must not change it on the next pass. */
  it('reaches the same answer when synced again', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const el = root as HTMLElement & { refresh(): Promise<void> };

    await el.refresh();
    await waitForChanges();
    await el.refresh();
    await waitForChanges();

    expect(currentLabels(root)).toEqual(['Shoes']);
  });

  it('leaves a nested trail its own crumbs', async () => {
    const { root } = await render(`
      <pf-breadcrumbs>
        <pf-breadcrumb href="/">Home</pf-breadcrumb>
        <pf-breadcrumb>
          <pf-breadcrumbs separator="›">
            <pf-breadcrumb href="/a">A</pf-breadcrumb>
            <pf-breadcrumb>B</pf-breadcrumb>
          </pf-breadcrumbs>
        </pf-breadcrumb>
      </pf-breadcrumbs>`);

    const inner = root.querySelector('pf-breadcrumbs') as HTMLElement;
    expect(separator(inner.querySelectorAll('pf-breadcrumb')[0])?.textContent).toBe('›');
    // The outer trail's own separator did not reach into the nested one.
    expect(separator(crumbs(root)[0])?.textContent).toBe('/');
  });
});
