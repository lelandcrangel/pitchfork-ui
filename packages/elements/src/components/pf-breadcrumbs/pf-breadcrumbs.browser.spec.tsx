/**
 * The two things the fast project cannot see: `slotchange`, which it never
 * fires, and the slot's own computed `display`, which comes from the UA
 * stylesheet rather than from this package's CSS.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-breadcrumbs';
import '../pf-breadcrumb/pf-breadcrumb';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-breadcrumbs');
  await customElements.whenDefined('pf-breadcrumb');
  await frame();
  await frame();
  return document.querySelector('pf-breadcrumbs') as HTMLElement;
};

const until = async (predicate: () => boolean, label = 'pf-breadcrumbs') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const FIXTURE = `
  <pf-breadcrumbs>
    <pf-breadcrumb href="/">Home</pf-breadcrumb>
    <pf-breadcrumb href="/products">Products</pf-breadcrumb>
  </pf-breadcrumbs>`;

const separator = (crumb: Element) => crumb.shadowRoot?.querySelector('[part="separator"]');

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The crumb that was last stops being last, so it grows a separator — which is
 * the whole reason the group has to be told when the trail changes.
 */
test('re-reads the trail when a crumb is appended', async () => {
  const el = await mount(FIXTURE);
  const products = el.querySelectorAll('pf-breadcrumb')[1];
  expect(separator(products)).toBeNull();

  const added = document.createElement('pf-breadcrumb');
  added.textContent = 'Shoes';
  el.append(added);

  await until(() => Boolean(separator(products)), 'the separator appearing');
  await until(() => added.hasAttribute('current-page'), 'the new crumb becoming current');
  expect(products.hasAttribute('current-page')).toBe(false);
});

test('re-reads the trail when the last crumb is removed', async () => {
  const el = await mount(FIXTURE);
  const [home, products] = Array.from(el.querySelectorAll('pf-breadcrumb'));
  expect(products.hasAttribute('current-page')).toBe(true);

  products.remove();
  await until(() => home.hasAttribute('current-page'), 'the trail shortening');
  expect(separator(home)).toBeNull();
});

/*
 * The crumbs have to be flex items of the `<ol>`, not of a box inside it. The
 * UA stylesheet gives a slot `display: contents`, so it generates no box of
 * its own — measured here, because neither test project applies the sheet that
 * says the same thing out loud.
 */
test('the crumbs are laid out by the list itself', async () => {
  const el = await mount(FIXTURE);
  const list = el.shadowRoot?.querySelector('[part="list"]') as HTMLElement;
  const slot = list.querySelector('slot') as HTMLSlotElement;

  expect(getComputedStyle(slot).display).toBe('contents');
  expect(slot.assignedElements().map((node) => node.tagName.toLowerCase())).toEqual([
    'pf-breadcrumb',
    'pf-breadcrumb',
  ]);
});
