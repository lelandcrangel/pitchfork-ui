/**
 * The interactive half of pf-pagination: real clicks, real disabled buttons,
 * and the pfPageChange event.
 *
 * `button.disabled` reads `undefined` in Stencil's mock DOM, and a click there
 * does not run the handler, so none of this is assertable in the `unit`
 * project. The markup and the page run are — those stay in the unit spec.
 */
import { expect, test } from 'vitest';
import './pf-pagination';

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.body.firstElementChild as HTMLElement;
  await customElements.whenDefined('pf-pagination');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
};

/** Stencil's queue is async, so a re-render lands several frames out. */
const until = async (predicate: () => boolean) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for pf-pagination to re-render');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const nav = (root: HTMLElement, which: 'previous' | 'next') =>
  root.shadowRoot?.querySelector(`[part~="${which}"]`) as HTMLButtonElement;
const current = (root: HTMLElement) =>
  root.shadowRoot?.querySelector('[part~="current"]')?.textContent ?? null;
const pageButton = (root: HTMLElement, label: string) =>
  Array.from(root.shadowRoot?.querySelectorAll('.page') ?? []).find(
    (b) => b.textContent === label,
  ) as HTMLButtonElement | undefined;

const changes = (root: HTMLElement) => {
  const seen: number[] = [];
  root.addEventListener('pfPageChange', (event) => {
    seen.push((event as CustomEvent<{ page: number }>).detail.page);
  });
  return seen;
};

test('advances itself when nothing holds the page', async () => {
  const root = await mount(`<pf-pagination total-pages="5" page="2"></pf-pagination>`);
  const seen = changes(root);

  nav(root, 'next').click();
  await until(() => current(root) === '3');

  expect(seen).toEqual([3]);
  expect((root as HTMLElement & { page: number }).page).toBe(3);
});

test('steps back, and reports the page it landed on', async () => {
  const root = await mount(`<pf-pagination total-pages="5" page="3"></pf-pagination>`);
  const seen = changes(root);

  nav(root, 'previous').click();
  await until(() => current(root) === '2');

  expect(seen).toEqual([2]);
});

test('jumps to a page the user clicks', async () => {
  const root = await mount(`<pf-pagination total-pages="10" page="1"></pf-pagination>`);
  const seen = changes(root);

  pageButton(root, '10')?.click();
  await until(() => current(root) === '10');

  expect(seen).toEqual([10]);
});

/*
 * The ends are not reachable past themselves: the button is disabled, so the
 * click does nothing and no event claims a move that did not happen.
 */
test('cannot be stepped past either end', async () => {
  const first = await mount(`<pf-pagination total-pages="3" page="1"></pf-pagination>`);
  const firstSeen = changes(first);
  expect(nav(first, 'previous').disabled).toBe(true);
  nav(first, 'previous').click();
  expect(firstSeen).toEqual([]);

  const last = await mount(`<pf-pagination total-pages="3" page="3"></pf-pagination>`);
  const lastSeen = changes(last);
  expect(nav(last, 'next').disabled).toBe(true);
  nav(last, 'next').click();
  expect(lastSeen).toEqual([]);
});

/* Clicking the page you are already on is not a change. */
test('stays quiet when the click would not move anything', async () => {
  const root = await mount(`<pf-pagination total-pages="5" page="3"></pf-pagination>`);
  const seen = changes(root);

  pageButton(root, '3')?.click();
  await new Promise((resolve) => setTimeout(resolve, 60));

  expect(seen).toEqual([]);
  expect(current(root)).toBe('3');
});

test('ignores every click while disabled', async () => {
  const root = await mount(`<pf-pagination total-pages="5" page="3" disabled></pf-pagination>`);
  const seen = changes(root);

  nav(root, 'next').click();
  pageButton(root, '1')?.click();
  await new Promise((resolve) => setTimeout(resolve, 60));

  expect(seen).toEqual([]);
  expect(current(root)).toBe('3');
});

/*
 * Holding `page` from outside is the controlled case: the element still emits,
 * and re-rendering with the same value leaves it where the consumer put it.
 */
test('can be driven from outside by setting page back', async () => {
  const root = (await mount(
    `<pf-pagination total-pages="5" page="2"></pf-pagination>`,
  )) as HTMLElement & { page: number };
  const seen = changes(root);

  root.addEventListener('pfPageChange', () => {
    root.page = 2;
  });

  nav(root, 'next').click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(seen).toEqual([3]);
  expect(current(root)).toBe('2');
});

test('a slotted label replaces the fallback text', async () => {
  const root = await mount(
    `<pf-pagination total-pages="5" page="2"><span slot="previous">Back</span><span slot="next">Forward</span></pf-pagination>`,
  );

  const slot = root.shadowRoot?.querySelector('slot[name="previous"]') as HTMLSlotElement;
  expect(slot.assignedNodes().map((n) => n.textContent)).toEqual(['Back']);
  expect(nav(root, 'previous').textContent).toBe('Previous');
});
