/**
 * The checkbox group is browser-tested in full: it is form-associated, and
 * its children are form-associated checkboxes whose state it owns.
 */
import { afterEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import './pf-checkbox-group';
import '../pf-checkbox/pf-checkbox';

type Group = HTMLElement & {
  value: string;
  disabled: boolean;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};
type Box = HTMLElement & { value: string; checked: boolean; disabled: boolean };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frame();
  }
};

const GROUP = (attrs = '', boxes = '') => `
  <pf-checkbox-group name="topics" legend="Topics" ${attrs}>
    <pf-checkbox value="news" label="News"></pf-checkbox>
    <pf-checkbox value="tips" label="Tips" ${boxes}></pf-checkbox>
    <pf-checkbox value="offers" label="Offers"></pf-checkbox>
  </pf-checkbox-group>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await until(
    () =>
      Array.from(document.querySelectorAll('pf-checkbox-group, pf-checkbox')).every((el) =>
        el.classList.contains('hydrated'),
      ),
    'hydration',
  );
  for (let i = 0; i < 3; i += 1) await frame();
  return document.querySelector('pf-checkbox-group') as Group;
};

const boxes = (group: Group) => Array.from(group.querySelectorAll('pf-checkbox')) as Box[];
const ticked = (group: Group) =>
  boxes(group)
    .filter((box) => box.checked)
    .map((box) => box.value);
const nativeBox = (box: Box) => box.shadowRoot!.querySelector('input') as HTMLInputElement;
const formEntries = () =>
  [...new FormData(document.querySelector('form') as HTMLFormElement).entries()].map(
    ([key, value]) => `${key}=${value}`,
  );

afterEach(() => {
  document.body.innerHTML = '';
});

test('announces itself as a group, named by its legend', async () => {
  await mount(GROUP('error="Pick one"'));

  await expect
    .element(page.getByRole('group', { name: 'Topics', exact: true }))
    .toBeInTheDocument();
  await expect
    .element(page.getByRole('group', { name: 'Topics', exact: true }))
    .toHaveAccessibleDescription('Pick one');
});

test('its value ticks the children', async () => {
  const group = await mount(GROUP('value="news,offers"'));
  expect(ticked(group)).toEqual(['news', 'offers']);

  group.value = 'tips';
  await until(() => ticked(group).join() === 'tips', 'the children to follow');
});

test("with no value, the children's own checked attributes are the start", async () => {
  const group = await mount(GROUP('', 'checked'));
  expect(group.value).toBe('tips');
});

/*
 * A child's pfChange is caught on the child, so a listener on the group hears
 * the group's own event, once, with the whole set.
 */
test('ticking a child reports the group once, with every ticked value', async () => {
  const group = await mount(GROUP('value="news"'));
  const heard: string[] = [];
  group.addEventListener('pfChange', (event) =>
    heard.push(JSON.stringify((event as CustomEvent).detail)),
  );

  nativeBox(boxes(group)[2]).click();
  await until(() => group.value === 'news,offers', 'the value to update');

  expect(heard).toEqual(['{"value":"news,offers","values":["news","offers"]}']);
});

test('submits one entry per ticked value under its own name', async () => {
  document.body.innerHTML = `<form>${GROUP('value="news,offers"')}</form>`;
  await mount(document.body.innerHTML);

  expect(formEntries()).toEqual(['topics=news', 'topics=offers']);
});

test('nothing ticked is absent from the submission', async () => {
  document.body.innerHTML = `<form>${GROUP()}</form>`;
  await mount(document.body.innerHTML);

  expect(formEntries()).toEqual([]);
});

test('required means at least one', async () => {
  const group = await mount(GROUP('required'));
  expect(await group.checkValidity()).toBe(false);
  expect(await group.getValidationMessage()).toBe('This field is required.');

  nativeBox(boxes(group)[0]).click();
  await until(() => group.value === 'news', 'the tick to land');
  expect(await group.checkValidity()).toBe(true);
});

test('disabling the group disables every child, and gives back their own state', async () => {
  const group = await mount(GROUP('', 'disabled'));
  group.disabled = true;
  await until(() => boxes(group).every((box) => box.disabled), 'every child to be disabled');

  group.disabled = false;
  await until(() => !boxes(group)[0].disabled, 'the children to be enabled again');
  // The one the consumer disabled stays disabled.
  expect(boxes(group).map((box) => box.disabled)).toEqual([false, true, false]);
});

/*
 * The children are form controls too, with resets of their own. Measured: each
 * captures its starting state after the group has pushed its value, so the two
 * agree -- including a child added after load with a `checked` attribute the
 * group overrides, which this test adds to be sure.
 */
test('a form reset restores the starting choices', async () => {
  document.body.innerHTML = `<form>${GROUP('value="news"')}</form>`;
  const group = await mount(document.body.innerHTML);

  const late = document.createElement('pf-checkbox') as Box;
  late.setAttribute('value', 'events');
  late.setAttribute('checked', '');
  group.append(late);
  await until(() => late.classList.contains('hydrated') && !late.checked, 'the group to untick it');

  nativeBox(boxes(group)[2]).click();
  await until(() => group.value === 'news,offers', 'the tick to land');

  (document.querySelector('form') as HTMLFormElement).reset();
  for (let i = 0; i < 3; i += 1) await frame();
  expect(ticked(group)).toEqual(['news']);
  expect(group.value).toBe('news');
});
