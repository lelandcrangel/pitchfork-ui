/**
 * Browser-tested in full: form-associated, so neither the mock DOM nor jsdom
 * gets past the first lifecycle call. Key events carry `composed: true`,
 * because the input is inside this shadow root and bubbling alone stops at the
 * boundary — measured on pf-select, where leaving it off made every keyboard
 * assertion time out.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-combobox';
import '../pf-option/pf-option';

type Combobox = HTMLElement & {
  value: string;
  open: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
  refresh(): Promise<void>;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const FIXTURE = (attrs = '') => `
  <pf-combobox ${attrs}>
    <pf-option value="apple">Apple</pf-option>
    <pf-option value="apricot">Apricot</pf-option>
    <pf-option value="banana">Banana</pf-option>
    <pf-option value="blackberry" disabled>Blackberry</pf-option>
    <pf-option value="cherry">Cherry</pf-option>
  </pf-combobox>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-combobox');
  await customElements.whenDefined('pf-option');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-combobox') as Combobox;
};

const until = async (predicate: () => boolean, label = 'pf-combobox') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const part = (el: Combobox, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const input = (el: Combobox) => part(el, 'input') as HTMLInputElement;
const listbox = (el: Combobox) => part(el, 'listbox') as HTMLElement;
const isOpen = (el: Combobox) => listbox(el).matches(':popover-open');
const option = (el: Combobox, value: string) =>
  el.querySelector(`pf-option[value="${value}"]`) as HTMLElement | null;
const shown = (el: Combobox) =>
  Array.from(el.querySelectorAll('pf-option'))
    .filter((o) => !o.hasAttribute('hidden'))
    .map((o) => o.getAttribute('value'));
const activeValue = (el: Combobox) =>
  el.querySelector('pf-option[active]')?.getAttribute('value') ?? null;

const type = async (el: Combobox, text: string) => {
  const field = input(el);
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const press = async (el: Combobox, key: string) => {
  input(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('is an editable combobox over a listbox', async () => {
  const el = await mount(FIXTURE());

  expect(input(el).getAttribute('role')).toBe('combobox');
  expect(input(el).getAttribute('aria-autocomplete')).toBe('list');
  expect(input(el).getAttribute('aria-expanded')).toBe('false');
  expect(listbox(el).getAttribute('role')).toBe('listbox');
});

/* Same shadow root for input and listbox, so this IDREF resolves. */
test('points the input at the listbox with an IDREF that resolves', async () => {
  const el = await mount(FIXTURE());

  const id = input(el).getAttribute('aria-controls');
  expect(id).toBe('listbox');
  expect(el.shadowRoot?.getElementById(id!)).toBe(listbox(el));
});

test('starts with the chosen option label in the field', async () => {
  const el = await mount(FIXTURE('value="banana"'));
  await until(() => input(el).value === 'Banana', 'the label to appear');
});

test('shows every option before anything is typed', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  expect(shown(el)).toEqual(['apple', 'apricot', 'banana', 'blackberry', 'cherry']);
});

test('filters as the query is typed', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  await type(el, 'ap');
  expect(shown(el)).toEqual(['apple', 'apricot']);

  await type(el, 'apr');
  expect(shown(el)).toEqual(['apricot']);
});

test('matches a substring, not just a prefix', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  await type(el, 'err');
  expect(shown(el)).toEqual(['blackberry', 'cherry']);
});

/*
 * The rule core holds: the label echoed back after a selection does not
 * filter. Without it, reopening the list to change your mind would show the
 * one answer you already had.
 */
test('does not filter when the query is only the chosen label', async () => {
  const el = await mount(FIXTURE('value="banana"'));
  await until(() => input(el).value === 'Banana');

  await el.show();
  await until(() => isOpen(el));

  expect(shown(el)).toEqual(['apple', 'apricot', 'banana', 'blackberry', 'cherry']);
});

/* Edited by one character, it becomes a real query again. */
test('filters again once the echoed label is edited', async () => {
  const el = await mount(FIXTURE('value="banana"'));
  await until(() => input(el).value === 'Banana');
  await el.show();
  await until(() => isOpen(el));

  await type(el, 'Banan');
  expect(shown(el)).toEqual(['banana']);
});

test('shows the empty message when nothing matches, and takes it back', async () => {
  const el = await mount(FIXTURE('empty-message="Nothing here"'));
  await el.show();
  await until(() => isOpen(el));

  await type(el, 'zzz');
  await until(() => part(el, 'empty') !== null, 'the empty message');
  expect(part(el, 'empty')?.textContent).toBe('Nothing here');

  await type(el, 'ap');
  await until(() => part(el, 'empty') === null, 'the empty message to go');
});

test('typing opens the listbox', async () => {
  const el = await mount(FIXTURE());

  await type(el, 'a');
  await until(() => isOpen(el), 'typing to open it');
});

test('ArrowDown opens it from a closed field', async () => {
  const el = await mount(FIXTURE());

  await press(el, 'ArrowDown');
  await until(() => isOpen(el), 'ArrowDown to open it');
});

test('the arrows move the active option and skip a disabled one', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'ArrowDown');
  await until(() => activeValue(el) === 'apricot');

  await press(el, 'ArrowDown');
  await until(() => activeValue(el) === 'banana');

  // Blackberry is disabled, so the next step is Cherry.
  await press(el, 'ArrowDown');
  await until(() => activeValue(el) === 'cherry');
});

/*
 * Home and End, which the React Combobox has not got, and arrows that wrap
 * rather than stop — matching pf-select, so the two neighbouring controls
 * behave the same way.
 */
test('Home and End go to the ends, and the arrows wrap', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'End');
  await until(() => activeValue(el) === 'cherry');

  await press(el, 'ArrowDown');
  await until(() => activeValue(el) === 'apple', 'the arrows to wrap');

  await press(el, 'ArrowUp');
  await until(() => activeValue(el) === 'cherry', 'and to wrap backwards');

  await press(el, 'Home');
  await until(() => activeValue(el) === 'apple');
});

test('the active option follows the filtered list', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await type(el, 'ch');
  await until(() => activeValue(el) === 'cherry', 'the active option to follow the filter');
});

test('Enter takes the active option and puts its label in the field', async () => {
  const el = await mount(FIXTURE());
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await el.show();
  await until(() => isOpen(el));
  await type(el, 'ban');
  await until(() => activeValue(el) === 'banana');

  await press(el, 'Enter');
  await until(() => el.value === 'banana', 'Enter to take the value');
  expect(changes).toEqual(['banana']);
  await until(() => input(el).value === 'Banana', 'the field to hold the label');
  await until(() => !isOpen(el));
});

test('a click takes that option', async () => {
  const el = await mount(FIXTURE());
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await el.show();
  await until(() => isOpen(el));
  option(el, 'cherry')!.click();

  await until(() => el.value === 'cherry');
  expect(changes).toEqual(['cherry']);
  await until(() => input(el).value === 'Cherry');
});

test('a disabled option does nothing', async () => {
  const el = await mount(FIXTURE('value="apple"'));
  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });

  await el.show();
  await until(() => isOpen(el));
  option(el, 'blackberry')!.click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(reported).toBe(false);
  expect(el.value).toBe('apple');
});

/*
 * A half-typed query must never linger over a different value, so closing
 * without choosing puts the chosen label back.
 */
test('Escape reverts the field to the chosen label', async () => {
  const el = await mount(FIXTURE('value="banana"'));
  await until(() => input(el).value === 'Banana');

  await el.show();
  await until(() => isOpen(el));
  await type(el, 'ch');
  expect(input(el).value).toBe('ch');

  await userEvent.keyboard('{Escape}');
  await until(() => !isOpen(el), 'Escape to close it');
  await until(() => input(el).value === 'Banana', 'the field to revert');
  expect(el.value).toBe('banana');
});

test('a real outside click reverts it too', async () => {
  document.body.innerHTML = `
    <button type="button" id="elsewhere">Elsewhere</button>
    ${FIXTURE('value="banana"')}`;
  await customElements.whenDefined('pf-combobox');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-combobox') as Combobox;
  await until(() => input(el).value === 'Banana');

  await el.show();
  await until(() => isOpen(el));
  await type(el, 'ch');

  await userEvent.click(document.getElementById('elsewhere')!);
  await until(() => !isOpen(el), 'the outside click to close it');
  await until(() => input(el).value === 'Banana', 'the field to revert');
});

test('the clear button empties both the field and the value', async () => {
  const el = await mount(FIXTURE('value="banana"'));
  await until(() => input(el).value === 'Banana');
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  (part(el, 'clear') as HTMLButtonElement).click();
  await until(() => el.value === '', 'the clear button');
  expect(changes).toEqual(['']);
  // Polled: the property is empty the moment it is set, but the rendered
  // field catches up on the next render, and Stencil's queue is async.
  await until(() => input(el).value === '', 'the field to empty');
  // And it reopens with the full list, so another choice is one click away.
  await until(() => isOpen(el), 'the listbox to reopen');
  expect(shown(el)).toHaveLength(5);
});

test('offers no clear button when there is nothing to clear', async () => {
  const el = await mount(FIXTURE());
  expect(part(el, 'clear')).toBeNull();
});

test('offers no clear button when clearable is off', async () => {
  const el = await mount(FIXTURE('value="banana" clearable="false"'));
  await until(() => input(el).value === 'Banana');
  expect(part(el, 'clear')).toBeNull();
});

test('a disabled combobox does not open', async () => {
  const el = await mount(FIXTURE('disabled'));

  input(el).click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(isOpen(el)).toBe(false);
});

test('follows a value set from outside', async () => {
  const el = await mount(FIXTURE());

  el.value = 'cherry';
  await until(() => input(el).value === 'Cherry', 'the field to follow');
  expect(option(el, 'cherry')?.hasAttribute('selected')).toBe(true);
});

/* slotchange, which the mock DOM never fires. */
test('picks up an option added while mounted', async () => {
  const el = await mount(FIXTURE());

  const added = document.createElement('pf-option');
  added.setAttribute('value', 'damson');
  added.textContent = 'Damson';
  el.appendChild(added);
  await customElements.whenDefined('pf-option');

  await el.show();
  await until(() => isOpen(el));
  await type(el, 'dam');
  await until(() => shown(el).join(',') === 'damson', 'the new option to be filterable');
});

test('works with an option whose value was only set as a property', async () => {
  document.body.innerHTML = `<pf-combobox></pf-combobox>`;
  await customElements.whenDefined('pf-combobox');
  await customElements.whenDefined('pf-option');
  const el = document.querySelector('pf-combobox') as Combobox;

  const added = document.createElement('pf-option') as HTMLElement & { value: string };
  added.textContent = 'From a property';
  el.appendChild(added);
  added.value = 'from-property';
  await until(() => added.getAttribute('value') === 'from-property', 'value to reflect');

  await el.show();
  await until(() => isOpen(el));
  added.click();

  await until(() => el.value === 'from-property', 'the click to report the value');
  await until(() => input(el).value === 'From a property');
});

// ─── Form association ───────────────────────────────────────────────────────

test('submits its value under its name', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="fruit" value="banana"')}</form>`;
  await customElements.whenDefined('pf-combobox');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['fruit', 'banana']]);
});

/* The value, never the typed query — the two are deliberately different. */
test('submits the value rather than whatever is in the field', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="fruit" value="banana"')}</form>`;
  await customElements.whenDefined('pf-combobox');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-combobox') as Combobox;
  await until(() => input(el).value === 'Banana');

  await el.show();
  await type(el, 'zzz');

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['fruit', 'banana']]);
});

test('reflects name, so a property-setting binding still submits', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('value="banana"')}</form>`;
  await customElements.whenDefined('pf-combobox');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const el = document.querySelector('pf-combobox') as Combobox & { name: string };
  el.name = 'fruit';
  await until(() => el.getAttribute('name') === 'fruit', 'name to reflect');

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['fruit', 'banana']]);
});

test('is absent from the submission when nothing is chosen', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="fruit"')}</form>`;
  await customElements.whenDefined('pf-combobox');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([]);
});

test('a form reset restores the value and the field together', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="fruit" value="banana"')}</form>`;
  await customElements.whenDefined('pf-combobox');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-combobox') as Combobox;
  await until(() => input(el).value === 'Banana');

  el.value = 'cherry';
  await until(() => input(el).value === 'Cherry');

  (document.getElementById('f') as HTMLFormElement).reset();
  await until(() => el.value === 'banana', 'the reset to restore the value');
  await until(() => input(el).value === 'Banana', 'and the field with it');
});

test('a required combobox with nothing chosen is invalid, and says why', async () => {
  const el = await mount(FIXTURE('name="fruit" required'));

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = 'banana';
  await until(() => el.value === 'banana');
  expect(await el.checkValidity()).toBe(true);
});

test('an error message wins over the required message', async () => {
  const el = await mount(FIXTURE('name="fruit" required error="Pick something in season"'));

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('Pick something in season');
});

test('labels the input', async () => {
  const el = await mount(FIXTURE('label="Fruit"'));

  expect((part(el, 'label') as HTMLLabelElement).htmlFor).toBe('input');
  expect(input(el).id).toBe('input');
});
