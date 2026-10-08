/**
 * `slotchange`, which the mock DOM never fires, and the two things that
 * depend on it: an item appended later being resolved against the rest, and
 * the brand box appearing when something is finally slotted into it.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-header-navigation';
import '../pf-nav-item/pf-nav-item';

type Nav = HTMLElement & { refresh(): Promise<void> };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-header-navigation');
  await customElements.whenDefined('pf-nav-item');
  await frame();
  await frame();
  return document.querySelector('pf-header-navigation') as Nav;
};

const until = async (predicate: () => boolean, label = 'pf-header-navigation') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const items = (el: Nav) => Array.from(el.querySelectorAll('pf-nav-item'));
const part = (el: Nav, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;
const currentLabels = (el: Nav) =>
  items(el)
    .filter((item) => item.hasAttribute('current-page'))
    .map((item) => item.textContent?.trim());

afterEach(() => {
  document.body.innerHTML = '';
});

const FIXTURE = `
  <pf-header-navigation>
    <pf-nav-item href="/">Home</pf-nav-item>
    <pf-nav-item href="/about" current>About</pf-nav-item>
  </pf-header-navigation>`;

test('an item appended later is resolved with the rest', async () => {
  const el = await mount(FIXTURE);

  expect(currentLabels(el)).toEqual(['About']);

  const added = document.createElement('pf-nav-item');
  added.setAttribute('href', '/contact');
  added.textContent = 'Contact';
  el.appendChild(added);

  await until(() => added.getAttribute('orientation') === 'horizontal', 'the new item');
  expect(currentLabels(el)).toEqual(['About']);
});

/*
 * The answer must not be written back onto the ask. If the group wrote
 * `current`, removing the marked item would leave the mark behind on an item
 * the consumer never marked — the defect a `pf-breadcrumbs` browser test
 * caught.
 */
test('removing the current item leaves nothing marked', async () => {
  const el = await mount(FIXTURE);

  items(el)[1].remove();
  await until(() => items(el).length === 1, 'the removal');
  await until(() => currentLabels(el).length === 0, 'the mark to go with it');
});

test('the brand box appears when something is slotted into it', async () => {
  const el = await mount(FIXTURE);

  /*
   * The class, not the computed `display`: neither test project applies
   * `styleUrl` CSS, so the box reads as a plain inline span here whether the
   * rule exists or not. The smoke checks the real build.
   */
  expect(part(el, 'brand').className).toContain('empty');

  const brand = document.createElement('span');
  brand.setAttribute('slot', 'brand');
  brand.textContent = 'Acme';
  el.appendChild(brand);

  await until(() => !part(el, 'brand').className.includes('empty'), 'the brand box');
  expect(part(el, 'brand').assignedSlot).toBeNull();
  expect((part(el, 'brand').querySelector('slot') as HTMLSlotElement).assignedElements()).toEqual([
    brand,
  ]);
});

/*
 * The sharpest case for keeping the ask and the answer apart. Two items both
 * ask; only the first is marked. Writing the answer back would clear the
 * second one's `current`, so removing the first would leave a navigation
 * where nothing is current even though the consumer had marked something.
 */
test('a second asking item survives the first being removed', async () => {
  const el = await mount(`
    <pf-header-navigation>
      <pf-nav-item href="/" current>Home</pf-nav-item>
      <pf-nav-item href="/about" current>About</pf-nav-item>
    </pf-header-navigation>`);

  await until(() => currentLabels(el).length === 1, 'one marked item');
  expect(currentLabels(el)).toEqual(['Home']);

  items(el)[0].remove();
  await until(() => items(el).length === 1, 'the removal');
  await until(() => currentLabels(el).length === 1, 'the second item to take over');
  expect(currentLabels(el)).toEqual(['About']);
});
