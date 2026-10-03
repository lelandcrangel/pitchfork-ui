/**
 * The one thing the fast project cannot see: `slotchange`. Both boxes here are
 * hidden rather than left out precisely so that content arriving later is
 * noticed, which is only testable in a real DOM.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-empty-state';
import '../pf-icon/pf-icon';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-empty-state');
  await frame();
  await frame();
  return document.querySelector('pf-empty-state') as HTMLElement;
};

const until = async (predicate: () => boolean, label = 'pf-empty-state') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: HTMLElement, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

test('notices an icon slotted in after mount', async () => {
  const el = await mount(`<pf-empty-state>No results</pf-empty-state>`);
  expect(part(el, 'icon').classList.contains('empty')).toBe(true);

  const illustration = document.createElement('img');
  illustration.slot = 'icon';
  illustration.alt = '';
  el.append(illustration);

  await until(() => !part(el, 'icon').classList.contains('empty'), 'the icon box appearing');
});

test('notices an action slotted in after mount, and its going away', async () => {
  const el = await mount(`<pf-empty-state>No results</pf-empty-state>`);
  expect(part(el, 'action').classList.contains('empty')).toBe(true);

  const button = document.createElement('button');
  button.slot = 'action';
  button.textContent = 'Clear filters';
  el.append(button);
  await until(() => !part(el, 'action').classList.contains('empty'), 'the action box appearing');

  button.remove();
  await until(() => part(el, 'action').classList.contains('empty'), 'the action box going');
});

/*
 * The description is styled through `::slotted()` and has no box, so there is
 * nothing to collapse: an unassigned slot generates nothing at all — measured
 * here as a zero box.
 */
test('a state with no description generates no box for one', async () => {
  await mount(`
    <pf-empty-state id="described">
      No results
      <span slot="description">Try a different search.</span>
    </pf-empty-state>
    <pf-empty-state id="plain">No results</pf-empty-state>`);

  const slotOf = (id: string) =>
    (document.getElementById(id) as HTMLElement).shadowRoot?.querySelector(
      'slot[name="description"]',
    ) as HTMLSlotElement;

  expect(slotOf('plain').getBoundingClientRect().height).toBe(0);
  expect(getComputedStyle(slotOf('plain')).display).toBe('contents');
  expect(slotOf('described').assignedElements()).toHaveLength(1);
  expect(
    (slotOf('described').assignedElements()[0] as HTMLElement).getBoundingClientRect().height,
  ).toBeGreaterThan(0);
});
