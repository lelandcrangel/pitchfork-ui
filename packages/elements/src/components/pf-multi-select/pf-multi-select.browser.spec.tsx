/**
 * Browser-tested in full: form-associated, and the claim worth making about it
 * — one entry per value from one control — needs a real `ElementInternals`.
 * Key events carry `composed: true`, or they never leave the shadow root.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test, vi } from 'vitest';
import './pf-multi-select';
import '../pf-option/pf-option';

type MultiSelect = HTMLElement & {
  value: string;
  open: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const FIXTURE = (attrs = '') => `
  <pf-multi-select ${attrs}>
    <pf-option value="red">Red</pf-option>
    <pf-option value="green">Green</pf-option>
    <pf-option value="blue">Blue</pf-option>
    <pf-option value="grey" disabled>Grey</pf-option>
  </pf-multi-select>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-multi-select');
  await customElements.whenDefined('pf-option');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-multi-select') as MultiSelect;
};

const until = async (predicate: () => boolean, label = 'pf-multi-select') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const part = (el: MultiSelect, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const trigger = (el: MultiSelect) => part(el, 'trigger') as HTMLButtonElement;
const listbox = (el: MultiSelect) => part(el, 'listbox') as HTMLElement;
const isOpen = (el: MultiSelect) => listbox(el).matches(':popover-open');
const option = (el: MultiSelect, value: string) =>
  el.querySelector(`pf-option[value="${value}"]`) as HTMLElement | null;
const chips = (el: MultiSelect) =>
  Array.from(el.shadowRoot?.querySelectorAll('[part="chip"]') ?? []).map((c) =>
    c.textContent?.trim(),
  );
const selectedValues = (el: MultiSelect) =>
  Array.from(el.querySelectorAll('pf-option[selected]')).map((o) => o.getAttribute('value'));
const activeValue = (el: MultiSelect) =>
  el.querySelector('pf-option[active]')?.getAttribute('value') ?? null;

const press = async (el: MultiSelect, key: string) => {
  trigger(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('shows the placeholder until something is chosen', async () => {
  const el = await mount(FIXTURE('placeholder="Pick colours"'));

  expect(trigger(el).textContent).toContain('Pick colours');
  expect(chips(el)).toEqual([]);
});

test('shows a chip per chosen value', async () => {
  const el = await mount(FIXTURE('value="red,blue"'));

  await until(() => chips(el).length === 2, 'two chips');
  expect(chips(el)).toEqual(['Red', 'Blue']);
  expect(selectedValues(el)).toEqual(['red', 'blue']);
});

/* The one ARIA difference from pf-select, and the one that matters. */
test('announces the listbox as multi-selectable', async () => {
  const el = await mount(FIXTURE());
  expect(listbox(el).getAttribute('aria-multiselectable')).toBe('true');
});

test('parses a value list with awkward spacing', async () => {
  const el = await mount(FIXTURE('value=" red , blue "'));
  await until(() => chips(el).length === 2);
  expect(chips(el)).toEqual(['Red', 'Blue']);
});

/*
 * The difference from pf-select: a pick toggles and the listbox stays open, so
 * choosing three things is one round trip rather than three.
 */
test('a click adds a value and keeps the listbox open', async () => {
  const el = await mount(FIXTURE());
  const changes: Array<{ value: string; values: string[] }> = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string; values: string[] }>).detail);
  });

  await el.show();
  await until(() => isOpen(el));

  option(el, 'red')!.click();
  await until(() => el.value === 'red');
  expect(isOpen(el)).toBe(true);

  option(el, 'blue')!.click();
  await until(() => el.value === 'red,blue', 'the second pick to be added');
  expect(isOpen(el)).toBe(true);

  expect(changes).toEqual([
    { value: 'red', values: ['red'] },
    { value: 'red,blue', values: ['red', 'blue'] },
  ]);
});

test('a second click on the same option removes it', async () => {
  const el = await mount(FIXTURE('value="red,green,blue"'));
  await el.show();
  await until(() => isOpen(el));

  option(el, 'green')!.click();
  await until(() => el.value === 'red,blue', 'green to be removed');
  // And the rest keep their order.
  await until(() => chips(el).join(',') === 'Red,Blue');
});

/* Appended in pick order, not in the options' order. */
test('keeps the values in the order they were picked', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  option(el, 'blue')!.click();
  await until(() => el.value === 'blue');
  option(el, 'red')!.click();
  await until(() => el.value === 'blue,red', 'pick order to be kept');
  await until(() => chips(el).join(',') === 'Blue,Red');
});

test('a disabled option cannot be chosen', async () => {
  const el = await mount(FIXTURE('value="red"'));
  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });

  await el.show();
  await until(() => isOpen(el));
  option(el, 'grey')!.click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(reported).toBe(false);
  expect(el.value).toBe('red');
});

test('Space toggles the active option without closing', async () => {
  const el = await mount(FIXTURE());

  await press(el, 'ArrowDown');
  await until(() => isOpen(el));
  await until(() => activeValue(el) === 'red');

  await press(el, ' ');
  await until(() => el.value === 'red', 'Space to add it');
  expect(isOpen(el)).toBe(true);

  await press(el, 'ArrowDown');
  await until(() => activeValue(el) === 'green');
  await press(el, ' ');
  await until(() => el.value === 'red,green', 'Space to add the next');
});

test('the arrows move and skip a disabled option', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'red');

  await press(el, 'End');
  // Grey is disabled, so End lands on Blue.
  await until(() => activeValue(el) === 'blue');

  await press(el, 'Home');
  await until(() => activeValue(el) === 'red');
});

test('opens on the first chosen option', async () => {
  const el = await mount(FIXTURE('value="blue"'));

  await el.show();
  await until(() => activeValue(el) === 'blue', 'the chosen option to be active');
});

test('a real Escape closes it and gives focus back', async () => {
  const el = await mount(FIXTURE('value="red"'));

  await el.show();
  await until(() => isOpen(el));

  await userEvent.keyboard('{Escape}');
  await until(() => !isOpen(el), 'Escape to close it');
  await until(() => el.shadowRoot?.activeElement === trigger(el), 'focus to return');
});

test('a disabled control does not open', async () => {
  const el = await mount(FIXTURE('disabled'));

  trigger(el).click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(isOpen(el)).toBe(false);
});

test('follows a value set from outside', async () => {
  const el = await mount(FIXTURE());

  el.value = 'green,blue';
  await until(() => chips(el).join(',') === 'Green,Blue', 'the chips to follow');
  expect(selectedValues(el)).toEqual(['green', 'blue']);
});

/*
 * A comma cannot survive the separator, so it is reported rather than
 * silently mangled into two values.
 */
test('warns once about an option value holding a comma', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  document.body.innerHTML = `
    <pf-multi-select>
      <pf-option value="a,b">Comma</pf-option>
      <pf-option value="plain">Plain</pf-option>
    </pf-multi-select>`;
  await customElements.whenDefined('pf-multi-select');
  await customElements.whenDefined('pf-option');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-multi-select') as MultiSelect;

  await until(() => warn.mock.calls.length > 0, 'the warning');
  expect(warn.mock.calls[0][0]).toContain('a,b');

  // Once, not on every render.
  el.value = 'plain';
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(warn.mock.calls).toHaveLength(1);

  warn.mockRestore();
});

// ─── Form association ───────────────────────────────────────────────────────

/*
 * The measurement this element is built on: a key repeated in a `FormData`
 * handed to `setFormValue` is submitted once per value, so `getAll` reads it
 * back as an array — the same shape as the React component's one hidden input
 * per selection.
 */
test('submits one entry per chosen value, under one name', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="colours" value="red,blue"')}</form>`;
  await customElements.whenDefined('pf-multi-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([
    ['colours', 'red'],
    ['colours', 'blue'],
  ]);
  expect(data.getAll('colours')).toEqual(['red', 'blue']);
});

test('submits in pick order, not the options order', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="colours" value="blue,red"')}</form>`;
  await customElements.whenDefined('pf-multi-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect(data.getAll('colours')).toEqual(['blue', 'red']);
});

test('reflects name, so a property-setting binding still submits', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('value="red"')}</form>`;
  await customElements.whenDefined('pf-multi-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const el = document.querySelector('pf-multi-select') as MultiSelect & { name: string };
  el.name = 'colours';
  await until(() => el.getAttribute('name') === 'colours', 'name to reflect');

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect(data.getAll('colours')).toEqual(['red']);
});

test('is absent from the submission when nothing is chosen', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="colours"')}</form>`;
  await customElements.whenDefined('pf-multi-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([]);
});

test('a form reset restores the values it started with', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="colours" value="red,blue"')}</form>`;
  await customElements.whenDefined('pf-multi-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-multi-select') as MultiSelect;

  el.value = 'green';
  await until(() => el.value === 'green');

  (document.getElementById('f') as HTMLFormElement).reset();
  await until(() => el.value === 'red,blue', 'the reset to restore the list');
});

test('a required control with nothing chosen is invalid, and says why', async () => {
  const el = await mount(FIXTURE('name="colours" required'));

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = 'red';
  await until(() => el.value === 'red');
  expect(await el.checkValidity()).toBe(true);
});

test('an error message wins over the required message', async () => {
  const el = await mount(FIXTURE('name="colours" required error="Pick two or more"'));

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('Pick two or more');
});

test('labels the trigger', async () => {
  const el = await mount(FIXTURE('label="Colours"'));

  expect((part(el, 'label') as HTMLLabelElement).htmlFor).toBe('trigger');
  expect(trigger(el).id).toBe('trigger');
});
