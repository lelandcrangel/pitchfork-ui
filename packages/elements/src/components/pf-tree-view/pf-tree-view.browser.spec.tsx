/**
 * The keyboard, which needs real focus, and `slotchange`, which the fast
 * project never fires. Every rule the keys follow is core's `resolveTreeKey`,
 * so what is tested here is that the intents are carried out — and the
 * measurement the design rests on: a nested host cannot take a roving
 * tabindex, so the tree keeps the focus and names the active item instead.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-tree-view';
import '../pf-tree-item/pf-tree-item';

type Tree = HTMLElement & {
  value: string;
  expanded: string;
  expandAll(): Promise<void>;
  refresh(): Promise<void>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const FIXTURE = (attrs = '') => `
  <pf-tree-view ${attrs}>
    <pf-tree-item value="src">
      <span slot="label">src</span>
      <pf-tree-item value="index.ts"><span slot="label">index.ts</span></pf-tree-item>
      <pf-tree-item value="components">
        <span slot="label">components</span>
        <pf-tree-item value="Button.tsx"><span slot="label">Button.tsx</span></pf-tree-item>
      </pf-tree-item>
    </pf-tree-item>
    <pf-tree-item value="package.json"><span slot="label">package.json</span></pf-tree-item>
  </pf-tree-view>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-tree-view');
  await customElements.whenDefined('pf-tree-item');
  await frame();
  await frame();
  return document.querySelector('pf-tree-view') as Tree;
};

const until = async (predicate: () => boolean, label = 'pf-tree-view') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const item = (el: Tree, value: string) =>
  el.querySelector(`pf-tree-item[value="${value}"]`) as HTMLElement;
/* The keyboard's place, which is an attribute and an IDREF rather than focus. */
const activeValue = (el: Tree) =>
  Array.from(el.querySelectorAll('pf-tree-item'))
    .find((node) => node.hasAttribute('active'))
    ?.getAttribute('value') ?? null;
const activeDescendant = (el: Tree) => {
  const id = el.getAttribute('aria-activedescendant');
  return id ? (el.querySelector(`#${id}`)?.getAttribute('value') ?? null) : null;
};

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The focus stays on the tree throughout; what moves is the active item and
 * the IDREF pointing at it. Both are checked, because the second is what a
 * screen reader reads.
 */
test('the arrows move down and up the visible items', async () => {
  const el = await mount(FIXTURE('expanded="src"'));

  el.focus();
  expect(document.activeElement).toBe(el);
  expect(activeValue(el)).toBe('src');

  await userEvent.keyboard('{ArrowDown}');
  await until(() => activeValue(el) === 'index.ts', 'ArrowDown');
  expect(activeDescendant(el)).toBe('index.ts');
  expect(document.activeElement).toBe(el);

  await userEvent.keyboard('{ArrowDown}');
  await until(() => activeValue(el) === 'components', 'ArrowDown again');

  await userEvent.keyboard('{ArrowUp}');
  await until(() => activeValue(el) === 'index.ts', 'ArrowUp');
});

/* A closed branch's children are not in the list to move through. */
test('the arrows skip a closed branch’s children', async () => {
  const el = await mount(FIXTURE());

  el.focus();
  await userEvent.keyboard('{ArrowDown}');
  await until(() => activeValue(el) === 'package.json', 'skipping the closed branch');
});

/* The ARIA rule: Right opens a closed branch, then moves into it. */
test('Right opens a branch, then moves into it', async () => {
  const el = await mount(FIXTURE());

  el.focus();
  await userEvent.keyboard('{ArrowRight}');
  await until(() => el.expanded === 'src', 'opening');
  expect(activeValue(el)).toBe('src');

  await userEvent.keyboard('{ArrowRight}');
  await until(() => activeValue(el) === 'index.ts', 'moving in');
});

test('Left closes a branch, then moves out to the parent', async () => {
  const el = await mount(FIXTURE('expanded="src"'));

  el.focus();
  await userEvent.keyboard('{ArrowDown}');
  await until(() => activeValue(el) === 'index.ts', 'moving in');

  await userEvent.keyboard('{ArrowLeft}');
  await until(() => activeValue(el) === 'src', 'moving out');

  await userEvent.keyboard('{ArrowLeft}');
  await until(() => el.expanded === '', 'closing');
});

test('Home and End jump to the first and last visible item', async () => {
  const el = await mount(FIXTURE('expanded="src"'));

  el.focus();
  await userEvent.keyboard('{End}');
  await until(() => activeValue(el) === 'package.json', 'End');

  await userEvent.keyboard('{Home}');
  await until(() => activeValue(el) === 'src', 'Home');
});

/* Activation selects and, on a branch, opens it — as a click on each would. */
test('Enter selects and toggles', async () => {
  const el = await mount(FIXTURE('value="package.json"'));
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) =>
    changes.push((event as CustomEvent<{ value: string }>).detail.value),
  );

  el.focus();
  // The keyboard starts on the selection, so it is moved to the branch first.
  await userEvent.keyboard('{Home}');
  await until(() => activeValue(el) === 'src', 'moving to the branch');

  await userEvent.keyboard('{Enter}');
  await until(() => el.value === 'src', 'selecting');
  await until(() => el.expanded === 'src', 'opening');
  expect(changes).toEqual(['src']);

  await userEvent.keyboard(' ');
  await until(() => el.expanded === '', 'closing again');
});

/*
 * The measurement the whole design rests on. A `tabindex="0"` host slotted
 * into another host's shadow tree is skipped by sequential navigation when the
 * outer host's tabindex is negative — which is exactly a nested
 * `pf-tree-item` under a roving tabindex, so that version of this element was
 * unreachable by Tab. The tree holds the tab stop instead, and tabbing in
 * lands on it with the keyboard already on the selection.
 */
test('is one tab stop, which is the tree itself', async () => {
  document.body.innerHTML = `
    <button id="before">before</button>
    ${FIXTURE('value="index.ts" expanded="src"')}
    <button id="after">after</button>`;
  await customElements.whenDefined('pf-tree-item');
  await frame();
  await frame();
  const el = document.querySelector('pf-tree-view') as Tree;

  (document.getElementById('before') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement).toBe(el);
  expect(activeValue(el)).toBe('index.ts');

  // One stop: the next Tab leaves the tree rather than walking its items.
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement?.id).toBe('after');
});

/*
 * And the proof that a roving tabindex could not have worked here, measured on
 * the elements themselves rather than on a stand-in: putting the tab stop on a
 * nested item leaves it unreachable.
 */
test('a nested item cannot be reached by Tab, whatever its tabindex', async () => {
  document.body.innerHTML = `
    <button id="before">before</button>
    ${FIXTURE('value="index.ts" expanded="src"')}
    <button id="after">after</button>`;
  await customElements.whenDefined('pf-tree-item');
  await frame();
  await frame();
  const el = document.querySelector('pf-tree-view') as Tree;

  el.removeAttribute('tabindex');
  item(el, 'src').tabIndex = -1;
  item(el, 'index.ts').tabIndex = 0;
  await frame();

  (document.getElementById('before') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement?.id).toBe('after');

  // Focusing it directly still works, which is what makes the trap subtle.
  item(el, 'index.ts').focus();
  expect(document.activeElement).toBe(item(el, 'index.ts'));
});

/*
 * The nested items stay in the tree when the branch is closed and are hidden
 * instead: a slot that is not rendered never fires `slotchange`, so an item
 * added to a closed branch would stay invisible for good.
 */
test('notices an item added to a closed branch', async () => {
  const el = await mount(FIXTURE());

  const added = document.createElement('pf-tree-item');
  added.setAttribute('value', 'new.ts');
  added.innerHTML = '<span slot="label">new.ts</span>';
  item(el, 'src').append(added);

  await until(() => added.getAttribute('aria-level') === '2', 'the new item being placed');

  await el.expandAll();
  await until(() => el.expanded.includes('src'), 'opening everything');
  el.focus();
  await userEvent.keyboard('{ArrowDown}');
  await until(() => activeValue(el) === 'index.ts', 'the first child');
});

test('a disabled item takes no focus from the arrows’ neighbours', async () => {
  const el = await mount(`
    <pf-tree-view>
      <pf-tree-item value="a"><span slot="label">A</span></pf-tree-item>
      <pf-tree-item value="b" disabled><span slot="label">B</span></pf-tree-item>
    </pf-tree-view>`);

  // It is still in the visible list, so the arrows reach it — the ARIA
  // pattern moves across a disabled item and refuses activation.
  el.focus();
  await userEvent.keyboard('{ArrowDown}');
  await until(() => activeValue(el) === 'b', 'moving onto it');

  const changes: string[] = [];
  el.addEventListener('pfChange', () => changes.push('x'));
  await userEvent.keyboard('{Enter}');
  await frame();
  await frame();
  expect(el.value).toBe('a');
  expect(changes).toEqual([]);
});
