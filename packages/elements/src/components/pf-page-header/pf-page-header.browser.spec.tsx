/**
 * The one thing the fast project cannot see: `slotchange`. Every optional box
 * in these three is hidden rather than left out precisely so that content
 * arriving later is noticed, which is only testable in a real DOM.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-page-header';
import '../pf-section-header/pf-section-header';
import '../pf-section-footer/pf-section-footer';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string, tag: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined(tag);
  await frame();
  await frame();
  return document.querySelector(tag) as HTMLElement;
};

const until = async (predicate: () => boolean, label = 'a header') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: HTMLElement, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const empty = (el: HTMLElement, name: string) => part(el, name).classList.contains('empty');

afterEach(() => {
  document.body.innerHTML = '';
});

test('pf-page-header notices actions slotted in after mount', async () => {
  const el = await mount(`<pf-page-header>Orders</pf-page-header>`, 'pf-page-header');
  expect(empty(el, 'actions')).toBe(true);

  const button = document.createElement('button');
  button.slot = 'actions';
  button.textContent = 'Export';
  el.append(button);
  await until(() => !empty(el, 'actions'), 'the action box appearing');

  button.remove();
  await until(() => empty(el, 'actions'), 'the action box going');
});

test('pf-section-header notices metadata slotted in after mount', async () => {
  const el = await mount(`<pf-section-header>Activity</pf-section-header>`, 'pf-section-header');
  expect(empty(el, 'metadata')).toBe(true);

  const meta = document.createElement('span');
  meta.slot = 'metadata';
  meta.textContent = 'Updated today';
  el.append(meta);
  await until(() => !empty(el, 'metadata'), 'the metadata box appearing');
});

/*
 * The footer's heading is its default slot, so the thing that fills it may be
 * a bare text node — which is why the check counts text as well as elements.
 */
test('pf-section-footer notices a heading arriving as text', async () => {
  const el = await mount(
    `<pf-section-footer><button slot="actions" type="button">Save</button></pf-section-footer>`,
    'pf-section-footer',
  );
  expect(empty(el, 'heading')).toBe(true);

  el.prepend(document.createTextNode('Next steps'));
  await until(() => !empty(el, 'heading'), 'the heading box appearing');
});

/*
 * The slots that carry no layout have no box, so there is nothing to collapse:
 * an unassigned slot generates nothing at all — measured here as a zero box.
 */
test('a header with no eyebrow or description generates no box for them', async () => {
  await mount(
    `<pf-page-header id="plain">Orders</pf-page-header>
     <pf-page-header id="full">
       <span slot="eyebrow">Shop</span>
       Orders
       <span slot="description">Everything bought this month.</span>
     </pf-page-header>`,
    'pf-page-header',
  );

  const slotOf = (id: string, name: string) =>
    (document.getElementById(id) as HTMLElement).shadowRoot?.querySelector(
      `slot[name="${name}"]`,
    ) as HTMLSlotElement;

  for (const name of ['eyebrow', 'description']) {
    expect(slotOf('plain', name).getBoundingClientRect().height).toBe(0);
    expect(getComputedStyle(slotOf('plain', name)).display).toBe('contents');
    expect(slotOf('full', name).assignedElements()).toHaveLength(1);
  }
});
