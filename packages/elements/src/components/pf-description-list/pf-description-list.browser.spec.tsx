/**
 * A description list is semantics first: the terms and their details have to
 * reach the accessibility tree as terms and definitions, through two shadow
 * roots. Read from Chromium's own tree.
 */
import { afterEach, expect, test } from 'vitest';
import { axNodesWithRole } from '../../chromium.browser-helper';
import './pf-description-list';
import '../pf-description-item/pf-description-item';

type List = HTMLElement & { orientation: string; divided: boolean };
type Item = HTMLElement & { orientation: string; divided: boolean };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frame();
  }
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await until(
    () =>
      Array.from(document.querySelectorAll('pf-description-list, pf-description-item')).every(
        (el) => el.classList.contains('hydrated'),
      ),
    'hydration',
  );
  for (let i = 0; i < 3; i += 1) await frame();
  return document.querySelector('pf-description-list') as List;
};

const items = (list: List) => Array.from(list.querySelectorAll('pf-description-item')) as Item[];

afterEach(() => {
  document.body.innerHTML = '';
});

const LIST = (attrs = '') => `
  <pf-description-list ${attrs}>
    <pf-description-item term="Plan">Team</pf-description-item>
    <pf-description-item><span slot="term">Seats</span>12 of 20</pf-description-item>
  </pf-description-list>`;

test('terms and details reach the tree as terms and definitions', async () => {
  await mount(LIST());

  expect((await axNodesWithRole('term')).length).toBe(2);
  expect((await axNodesWithRole('definition')).length).toBe(2);
});

test('the term comes from the attribute or the slot', async () => {
  const list = await mount(LIST());
  const [plan, seats] = items(list);

  expect(plan.shadowRoot!.querySelector('dt')!.textContent).toBe('Plan');
  const slotted = (seats.shadowRoot!.querySelector('slot[name="term"]') as HTMLSlotElement)
    .assignedNodes()
    .map((node) => node.textContent);
  expect(slotted).toEqual(['Seats']);
});

test('the list pushes its orientation and rule onto every item', async () => {
  const list = await mount(LIST('orientation="vertical" divided'));
  expect(items(list).map((item) => [item.orientation, item.divided])).toEqual([
    ['vertical', true],
    ['vertical', true],
  ]);

  list.divided = false;
  list.orientation = 'horizontal';
  await until(() => items(list).every((item) => !item.divided), 'the rule to go');
  // Reflected on the item's next render, which the stylesheet selects on.
  await until(
    () => items(list).every((item) => item.getAttribute('orientation') === 'horizontal'),
    'the orientation to reflect',
  );
});

test('an item added later is given the list layout', async () => {
  const list = await mount(LIST('divided'));
  const added = document.createElement('pf-description-item') as Item;
  added.setAttribute('term', 'Renews');
  added.textContent = '1 March';
  list.append(added);

  await until(() => added.divided === true, 'the new item to be divided');
});
