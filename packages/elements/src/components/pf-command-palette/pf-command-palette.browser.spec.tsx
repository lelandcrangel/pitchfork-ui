/**
 * pf-command-palette is browser-tested, all of it: `<dialog>.showModal()`, the
 * native focus trap, the page-scroll lock, `slotchange` and ARIA element
 * reflection are none of them things the mock DOM has.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-command-palette';
import '../pf-command-group/pf-command-group';
import '../pf-command-item/pf-command-item';

type Palette = HTMLElement & {
  open: boolean;
  dismissable: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
  refresh(): Promise<void>;
};

const FIXTURE = (attrs = '') => `
  <button type="button" id="outside">Outside</button>
  <pf-command-palette ${attrs}>
    <pf-command-group label="File">
      <pf-command-item value="new">New file</pf-command-item>
      <pf-command-item value="open" description="Pick from recent">Open file</pf-command-item>
    </pf-command-group>
    <pf-command-group label="App">
      <pf-command-item value="settings">Settings</pf-command-item>
      <pf-command-item value="quit" disabled>Quit</pf-command-item>
    </pf-command-group>
  </pf-command-palette>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-command-palette');
  await customElements.whenDefined('pf-command-group');
  await customElements.whenDefined('pf-command-item');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-command-palette') as Palette;
};

const until = async (predicate: () => boolean, label = 'pf-command-palette') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const dialog = (el: Palette) => el.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
const input = (el: Palette) => el.shadowRoot?.querySelector('input') as HTMLInputElement;
const part = (el: Palette, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

const visibleItems = (el: Palette) =>
  Array.from(el.querySelectorAll('pf-command-item')).filter((i) => !i.hasAttribute('hidden'));
const labels = (el: Palette) => visibleItems(el).map((i) => i.textContent?.trim());
const active = (el: Palette) => el.querySelector('pf-command-item[aria-selected="true"]');

const type = async (el: Palette, value: string) => {
  const field = input(el);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

afterEach(() => {
  document.body.innerHTML = '';
  document.documentElement.style.overflow = '';
});

test('is closed to begin with, and its dialog is a real dialog', async () => {
  const el = await mount(FIXTURE());

  expect(dialog(el).tagName).toBe('DIALOG');
  expect(dialog(el).open).toBe(false);
});

test('show() opens it, focuses the input and locks page scroll', async () => {
  const el = await mount(FIXTURE());

  await el.show();
  await until(() => dialog(el).open);
  await until(() => el.shadowRoot?.activeElement === input(el), 'the input to take focus');
  expect(document.documentElement.style.overflow).toBe('hidden');

  await el.hide();
  await until(() => document.documentElement.style.overflow === '', 'the scroll lock to lift');
});

/* showModal()'s focus trap, which is why useFocusTrap has no counterpart. */
test('will not let a light-DOM button take focus back', async () => {
  const el = await mount(FIXTURE());
  const outside = document.getElementById('outside') as HTMLButtonElement;

  await el.show();
  await until(() => dialog(el).open);

  outside.focus();
  expect(document.activeElement).not.toBe(outside);
});

test('shows every command before anything is typed', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  expect(labels(el)).toEqual(['New file', 'Open file', 'Settings', 'Quit']);
});

test('filters on the label as the query is typed', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  await type(el, 'set');
  expect(labels(el)).toEqual(['Settings']);
});

/* The description is searched too, which is core's predicate, not the DOM's. */
test('filters on a description', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  await type(el, 'recent');
  expect(labels(el)).toEqual(['Open file']);
});

/*
 * The group label counts towards each of its items, so typing a section name
 * narrows to that section — what the React component does with its `group`
 * field, reproduced structurally.
 */
test('filters on the enclosing group label', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  await type(el, 'file');
  // "File" the group, plus "New file" and "Open file" by their own labels.
  expect(labels(el)).toEqual(['New file', 'Open file']);
});

test('hides a group once a query excludes all of its items', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  await type(el, 'settings');
  const groups = Array.from(el.querySelectorAll('pf-command-group'));
  expect(groups.map((g) => g.hasAttribute('hidden'))).toEqual([true, false]);
});

test('shows the empty message when nothing matches, and takes it back', async () => {
  const el = await mount(FIXTURE('open empty-message="Nothing here"'));
  await until(() => dialog(el).open);

  await type(el, 'zzz');
  await until(() => part(el, 'empty') !== null, 'the empty message');
  expect(part(el, 'empty')?.textContent).toBe('Nothing here');

  await type(el, 'set');
  await until(() => part(el, 'empty') === null, 'the empty message to go');
});

/*
 * The measurement this element is built around. `aria-activedescendant` is an
 * IDREF and does not cross a shadow boundary: the input is in this shadow root
 * and the options are slotted light DOM. Chromium reports a cross-root IDREF
 * as absent from the accessibility tree entirely, while
 * `ariaActiveDescendantElement` resolves, because the option is in an ancestor
 * scope of the input's tree. So the property is the contract, and this is the
 * assertion that it is actually wired to the right element.
 */
test('points the input at the active option as an element, not an id', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  await until(() => active(el) !== null, 'a first active option');

  const field = input(el) as HTMLInputElement & { ariaActiveDescendantElement?: Element | null };
  expect('ariaActiveDescendantElement' in field).toBe(true);
  expect(field.ariaActiveDescendantElement).toBe(active(el));

  // It follows the arrows rather than being set once.
  const first = active(el);
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await until(() => active(el) !== first, 'the active option to move');
  expect(field.ariaActiveDescendantElement).toBe(active(el));

  /*
   * The attribute is present and *empty*, and that is the platform's doing,
   * not ours: assigning the element property makes Chromium write
   * `aria-activedescendant=""` — measured on a plain input with no framework
   * involved. It is how the platform says "the real value is the element
   * reference, and there is no id to serialise into here". What matters is
   * that it never holds a stale id that would resolve to nothing.
   */
  expect(field.getAttribute('aria-activedescendant')).toBe('');
});

test('starts on the first command and moves with the arrows', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  await until(() => active(el) !== null);

  expect(active(el)?.getAttribute('value')).toBe('new');

  const field = input(el);
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await until(() => active(el)?.getAttribute('value') === 'open');

  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await until(() => active(el)?.getAttribute('value') === 'new');
});

/* Home and End go to the ends of the *filtered* list. */
test('Home and End jump to the ends of what is showing', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  const field = input(el);

  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  // Quit is disabled, so End lands on the last *enabled* command.
  await until(() => active(el)?.getAttribute('value') === 'settings');

  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await until(() => active(el)?.getAttribute('value') === 'new');
});

test('skips a disabled command when moving', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  const field = input(el);

  for (let press = 0; press < 2; press += 1) {
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  await until(() => active(el)?.getAttribute('value') === 'settings');

  // One more wraps past the disabled Quit, back to the top.
  field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await until(() => active(el)?.getAttribute('value') === 'new', 'the wrap past Quit');
});

test('Enter runs the active command and closes', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  const chosen: string[] = [];
  el.addEventListener('pfSelect', (event) => {
    chosen.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await type(el, 'set');
  await until(() => active(el)?.getAttribute('value') === 'settings');

  input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await until(() => !dialog(el).open, 'Enter to close it');
  expect(chosen).toEqual(['settings']);
});

test('a click runs that command and closes', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  const chosen: string[] = [];
  el.addEventListener('pfSelect', (event) => {
    chosen.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  (el.querySelector('pf-command-item[value="open"]') as HTMLElement).click();
  await until(() => !dialog(el).open, 'the click to close it');
  expect(chosen).toEqual(['open']);
});

/* A disabled item swallows its own click rather than letting it select. */
test('a disabled command does nothing when clicked', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  let selected = false;
  el.addEventListener('pfSelect', () => {
    selected = true;
  });

  (el.querySelector('pf-command-item[value="quit"]') as HTMLElement).click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(selected).toBe(false);
  expect(dialog(el).open).toBe(true);
});

/* Enter on a disabled active option is the same refusal, by another route. */
test('Enter does nothing when the only match is disabled', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);
  let selected = false;
  el.addEventListener('pfSelect', () => {
    selected = true;
  });

  await type(el, 'quit');
  expect(labels(el)).toEqual(['Quit']);

  input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(selected).toBe(false);
  expect(dialog(el).open).toBe(true);
});

test('a real Escape closes it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.keyboard('{Escape}');
  await until(() => !dialog(el).open, 'Escape to close it');
});

test('a real Escape does not close a non-dismissable palette', async () => {
  const el = await mount(FIXTURE('dismissable="false"'));
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.keyboard('{Escape}');
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(dialog(el).open).toBe(true);
});

test('a click on the backdrop closes it, a click on the panel does not', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  part(el, 'panel')?.click();
  expect(dialog(el).open).toBe(true);

  dialog(el).click();
  await until(() => !dialog(el).open, 'the backdrop click to close it');
});

/* Reopening starts fresh, as the React component does. */
test('clears the query between openings', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  await type(el, 'set');
  expect(labels(el)).toEqual(['Settings']);

  await el.hide();
  await until(() => !dialog(el).open);
  await el.show();
  await until(() => dialog(el).open);

  // Polled, not sampled: Stencil's queue is async, so the input's value is
  // still the old query for several frames after `open` flips.
  await until(() => input(el).value === '', 'the query to clear');
  expect(labels(el)).toEqual(['New file', 'Open file', 'Settings', 'Quit']);
});

/* slotchange, which the mock DOM never fires. */
test('picks up a command added while it is open', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  const item = document.createElement('pf-command-item');
  item.setAttribute('value', 'late');
  item.textContent = 'Late addition';
  el.appendChild(item);

  await until(() => labels(el).includes('Late addition'), 'the new command to appear');

  await type(el, 'late');
  expect(labels(el)).toEqual(['Late addition']);
});

/*
 * Text edited inside an already-assigned node does not fire slotchange — the
 * caveat pf-tooltip documents — so refresh() is the way back to a correct
 * filter.
 */
test('refresh() re-reads a label edited in place', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  await type(el, 'renamed');
  expect(labels(el)).toEqual([]);

  const item = el.querySelector('pf-command-item[value="new"]') as HTMLElement;
  item.textContent = 'Renamed command';
  await el.refresh();

  await until(() => labels(el).includes('Renamed command'), 'refresh to re-read the label');
});

test('announces every open and close, whoever caused it', async () => {
  const el = await mount(FIXTURE());
  const seen: boolean[] = [];
  el.addEventListener('pfOpenChange', (event) => {
    seen.push((event as CustomEvent<{ open: boolean }>).detail.open);
  });

  await el.show();
  await until(() => dialog(el).open);
  await userEvent.keyboard('{Escape}');
  await until(() => !dialog(el).open);

  expect(seen).toEqual([true, false]);
});

test('the input is a combobox pointing at the listbox', async () => {
  const el = await mount(FIXTURE('open'));
  await until(() => dialog(el).open);

  expect(input(el).getAttribute('role')).toBe('combobox');
  expect(input(el).getAttribute('aria-expanded')).toBe('true');
  expect(part(el, 'list')?.getAttribute('role')).toBe('listbox');
  expect(el.querySelector('pf-command-item')?.getAttribute('role')).toBe('option');
  expect(el.querySelector('pf-command-group')?.getAttribute('role')).toBe('group');
});

/*
 * The way the generated bindings actually set props: as *properties*, never as
 * attributes. Every other test here writes `value="new"` into the fixture
 * HTML, so all of them passed while the React app reported an empty value --
 * `value` was unreflected, the palette's `[value=...]` query matched nothing
 * and `getAttribute('value')` was null. Only the consumer app caught it.
 */
test('reports a value that was only ever set as a property', async () => {
  document.body.innerHTML = `<pf-command-palette open></pf-command-palette>`;
  await customElements.whenDefined('pf-command-palette');
  await customElements.whenDefined('pf-command-item');
  const el = document.querySelector('pf-command-palette') as Palette;

  const item = document.createElement('pf-command-item') as HTMLElement & { value: string };
  item.textContent = 'Set by property';
  el.appendChild(item);
  item.value = 'from-property';

  const chosen: string[] = [];
  el.addEventListener('pfSelect', (event) => {
    chosen.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await until(() => active(el) === item, 'the command to become active');

  // Reflected, so an attribute selector finds it too.
  expect(item.getAttribute('value')).toBe('from-property');
  expect(el.querySelector('pf-command-item[value="from-property"]')).toBe(item);

  input(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await until(() => chosen.length === 1, 'the selection to be reported');
  expect(chosen).toEqual(['from-property']);
});
