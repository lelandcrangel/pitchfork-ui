/**
 * `slotchange`, which the mock DOM never fires, and the measurement the
 * design rests on: it is not composed, so the navigation never hears a
 * section's own slot change and the section has to tell it.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-sidebar-navigation';
import '../pf-nav-section/pf-nav-section';
import '../pf-nav-item/pf-nav-item';

type Nav = HTMLElement & { refresh(): Promise<void> };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-sidebar-navigation');
  await customElements.whenDefined('pf-nav-section');
  await customElements.whenDefined('pf-nav-item');
  await frame();
  await frame();
  return document.querySelector('pf-sidebar-navigation') as Nav;
};

const until = async (predicate: () => boolean, label = 'pf-sidebar-navigation') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const items = (el: Nav) => Array.from(el.querySelectorAll('pf-nav-item'));
const sections = (el: Nav) => Array.from(el.querySelectorAll('pf-nav-section'));
const part = (host: Element, name: string) =>
  host.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;
const currentLabels = (el: Nav) =>
  items(el)
    .filter((item) => item.hasAttribute('current-page'))
    .map((item) => item.textContent?.trim());

afterEach(() => {
  document.body.innerHTML = '';
});

const FIXTURE = `
  <pf-sidebar-navigation>
    <pf-nav-section>
      <span slot="title">Main</span>
      <pf-nav-item href="/" current>Home</pf-nav-item>
    </pf-nav-section>
    <pf-nav-section>
      <span slot="title">Admin</span>
      <pf-nav-item href="/users">Users</pf-nav-item>
    </pf-nav-section>
  </pf-sidebar-navigation>`;

/*
 * The whole reason `pf-nav-section` emits `pfNavStructure`: the navigation's
 * own slot did not change, only the section's, and `slotchange` does not
 * cross a shadow boundary. Without the event the new item is never given an
 * orientation or a place in the one-current resolution.
 */
test('an item appended inside a section is picked up', async () => {
  const el = await mount(FIXTURE);

  const added = document.createElement('pf-nav-item');
  added.setAttribute('href', '/audit');
  added.textContent = 'Audit';
  sections(el)[1].appendChild(added);

  await until(() => added.getAttribute('orientation') === 'vertical', 'the new item');
  expect(currentLabels(el)).toEqual(['Home']);
});

/* A whole section appended later is the navigation's own slot changing. */
test('a section appended later brings its items with it', async () => {
  const el = await mount(FIXTURE);

  const section = document.createElement('pf-nav-section');
  const item = document.createElement('pf-nav-item');
  item.setAttribute('href', '/billing');
  item.textContent = 'Billing';
  section.appendChild(item);
  el.appendChild(section);

  await until(() => item.getAttribute('orientation') === 'vertical', 'the new section');
  expect(items(el)).toHaveLength(3);
});

/* The event is the section's, and it must not reach the consumer twice. */
test('the navigation swallows the structure event', async () => {
  const el = await mount(FIXTURE);
  let heard = 0;
  document.addEventListener('pfNavStructure', () => {
    heard += 1;
  });

  const added = document.createElement('pf-nav-item');
  added.setAttribute('href', '/audit');
  added.textContent = 'Audit';
  sections(el)[0].appendChild(added);

  await until(() => added.getAttribute('orientation') === 'vertical', 'the new item');
  expect(heard).toBe(0);
});

/*
 * The ask and the answer kept apart, in the case that tells them apart: both
 * items ask, only the first is marked, and removing the first must leave the
 * second marked rather than leave the navigation with no current page.
 */
test('a second asking item survives the first being removed', async () => {
  const el = await mount(`
    <pf-sidebar-navigation>
      <pf-nav-section>
        <pf-nav-item href="/" current>Home</pf-nav-item>
      </pf-nav-section>
      <pf-nav-section>
        <pf-nav-item href="/users" current>Users</pf-nav-item>
      </pf-nav-section>
    </pf-sidebar-navigation>`);

  await until(() => currentLabels(el).length === 1, 'one marked item');
  expect(currentLabels(el)).toEqual(['Home']);

  items(el)[0].remove();
  await until(() => currentLabels(el).join() === 'Users', 'the second item to take over');
});

/*
 * The title names the list with a same-root IDREF, and that is the kind that
 * resolves: measured against Chromium's accessibility tree elsewhere, and
 * here against the element the reference actually finds.
 */
test('the title resolves inside the section’s own shadow root', async () => {
  const el = await mount(FIXTURE);
  const section = sections(el)[0];
  const list = part(section, 'list');

  const target = section.shadowRoot!.getElementById(list.getAttribute('aria-labelledby')!);
  expect(target).toBe(part(section, 'title'));
  expect((target!.querySelector('slot') as HTMLSlotElement).assignedElements()[0].textContent).toBe(
    'Main',
  );
});

/* The footer draws a rule across the sidebar, so an empty one must not. */
test('the footer box appears only when something is slotted into it', async () => {
  const el = await mount(FIXTURE);

  expect(part(el, 'footer').className).toContain('empty');

  const footer = document.createElement('span');
  footer.setAttribute('slot', 'footer');
  footer.textContent = 'v2.1';
  el.appendChild(footer);

  await until(() => !part(el, 'footer').className.includes('empty'), 'the footer box');
});
