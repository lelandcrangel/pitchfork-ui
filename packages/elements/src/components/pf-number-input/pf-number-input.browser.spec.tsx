/**
 * Browser-tested in full: form-associated, so neither the mock DOM (which
 * stubs ElementInternals) nor jsdom (no `setFormValue`) gets past its first
 * lifecycle call.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-number-input';
import '../pf-icon/pf-icon';

type NumberInput = HTMLElement & {
  value: string;
  stepBy(direction: 1 | -1): Promise<void>;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-number-input');
  await frame();
  await frame();
  return document.querySelector('pf-number-input') as NumberInput;
};

const until = async (predicate: () => boolean, label = 'pf-number-input') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: NumberInput, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const input = (el: NumberInput) => part(el, 'input') as HTMLInputElement;

afterEach(() => {
  document.body.innerHTML = '';
});

test('is a spinbutton that reports its range', async () => {
  const el = await mount(`<pf-number-input value="5" min="0" max="10"></pf-number-input>`);

  expect(input(el).getAttribute('role')).toBe('spinbutton');
  expect(input(el).getAttribute('aria-valuenow')).toBe('5');
  expect(input(el).getAttribute('aria-valuemin')).toBe('0');
  expect(input(el).getAttribute('aria-valuemax')).toBe('10');
});

test('the buttons step, and report the number beside the string', async () => {
  const el = await mount(`<pf-number-input value="5"></pf-number-input>`);
  const changes: Array<{ value: string; number: number | null }> = [];
  el.addEventListener('pfChange', (event) =>
    changes.push((event as CustomEvent<{ value: string; number: number | null }>).detail),
  );

  (part(el, 'increment') as HTMLButtonElement).click();
  await until(() => el.value === '6', 'stepping up');

  (part(el, 'decrement') as HTMLButtonElement).click();
  await until(() => el.value === '5', 'stepping down');

  expect(changes).toEqual([
    { value: '6', number: 6 },
    { value: '5', number: 5 },
  ]);
});

/* Core's rounding: the whole reason it exists. */
test('ten steps of a tenth reach exactly one', async () => {
  const el = await mount(`<pf-number-input value="0" step="0.1"></pf-number-input>`);

  for (let i = 0; i < 10; i += 1) await el.stepBy(1);
  await frame();

  expect(el.value).toBe('1');
});

test('clamps at both ends, and disables the button that cannot move', async () => {
  const el = await mount(`<pf-number-input value="10" min="0" max="10"></pf-number-input>`);
  await until(() => (part(el, 'increment') as HTMLButtonElement).disabled, 'the top');

  await el.stepBy(1);
  await frame();
  expect(el.value).toBe('10');

  el.value = '0';
  await until(() => (part(el, 'decrement') as HTMLButtonElement).disabled, 'the bottom');
  await el.stepBy(-1);
  await frame();
  expect(el.value).toBe('0');
});

/* An empty field has to start somewhere, and the bound is the useful place. */
test('steps from the bound when the field is empty', async () => {
  const el = await mount(`<pf-number-input min="10" max="20"></pf-number-input>`);

  await el.stepBy(1);
  await until(() => el.value === '11', 'stepping up from empty');
});

test('the arrows step, and Home and End jump to the bounds', async () => {
  const el = await mount(`<pf-number-input value="5" min="0" max="10"></pf-number-input>`);

  input(el).focus();
  await userEvent.keyboard('{ArrowUp}');
  await until(() => el.value === '6', 'ArrowUp');

  await userEvent.keyboard('{ArrowDown}');
  await until(() => el.value === '5', 'ArrowDown');

  await userEvent.keyboard('{Home}');
  await until(() => el.value === '0', 'Home');

  await userEvent.keyboard('{End}');
  await until(() => el.value === '10', 'End');
});

/*
 * The draft is kept as typed: clamping mid-keystroke would make "5"
 * unreachable in a field whose minimum is 50, and rounding would eat the "."
 * of "1.5" as it was typed.
 */
test('keeps a half-typed number as typed', async () => {
  const el = await mount(`<pf-number-input step="0.1"></pf-number-input>`);

  input(el).focus();
  await userEvent.keyboard('1.');
  await until(() => el.value === '1', 'the parsed value');
  await frame();
  await frame();
  // The field still reads what was typed, and the value is the number in it.
  // Measured: this assertion passes even without the draft, because the
  // keystrokes land after the last render either way — the blur test below is
  // the one that sees the difference.
  expect(input(el).value).toBe('1.');

  await userEvent.keyboard('5');
  await until(() => el.value === '1.5', 'the typed value');
  await frame();
  expect(input(el).value).toBe('1.5');
});

test('gives the draft up on blur, so the field shows its real value', async () => {
  const el = await mount(`<pf-number-input value="5" min="0" max="10"></pf-number-input>`);

  input(el).focus();
  await userEvent.keyboard('{Backspace}99');
  expect(input(el).value).toBe('99');
  // The value itself was clamped as it was typed.
  await until(() => el.value === '10', 'the clamped value');

  input(el).blur();
  await until(() => input(el).value === '10', 'the draft being given up');
});

/* An empty field is empty, not zero — a form reading one as the other is a bug. */
test('an emptied field submits nothing rather than zero', async () => {
  document.body.innerHTML = `
    <form id="form">
      <pf-number-input name="quantity" value="5"></pf-number-input>
    </form>`;
  await customElements.whenDefined('pf-number-input');
  await frame();
  await frame();
  const el = document.querySelector('pf-number-input') as NumberInput;
  const form = document.getElementById('form') as HTMLFormElement;

  expect(new FormData(form).get('quantity')).toBe('5');

  input(el).focus();
  await userEvent.keyboard('{Backspace}');
  await until(() => el.value === '', 'clearing the field');

  expect(new FormData(form).get('quantity')).toBe('');
  expect(input(el).getAttribute('aria-valuenow')).toBeNull();
});

/* The submission name comes from the attribute, which is why it is reflected. */
test('submits under a name set as a property', async () => {
  document.body.innerHTML = `<form id="form"><pf-number-input value="7"></pf-number-input></form>`;
  await customElements.whenDefined('pf-number-input');
  await frame();
  const el = document.querySelector('pf-number-input') as NumberInput & { name?: string };
  el.name = 'quantity';
  await frame();
  await frame();

  expect(el.getAttribute('name')).toBe('quantity');
  expect(new FormData(document.getElementById('form') as HTMLFormElement).get('quantity')).toBe(
    '7',
  );
});

test('a reset restores the value it started with', async () => {
  document.body.innerHTML = `
    <form id="form">
      <pf-number-input name="quantity" value="5"></pf-number-input>
      <button type="reset">Reset</button>
    </form>`;
  await customElements.whenDefined('pf-number-input');
  await frame();
  await frame();
  const el = document.querySelector('pf-number-input') as NumberInput;

  await el.stepBy(1);
  await until(() => el.value === '6', 'stepping');

  (document.querySelector('button[type="reset"]') as HTMLButtonElement).click();
  await until(() => el.value === '5', 'the reset');
});

test('required and error drive validity', async () => {
  const el = await mount(`<pf-number-input name="quantity" required></pf-number-input>`);
  expect(await el.checkValidity()).toBe(false);

  el.value = '3';
  await frame();
  expect(await el.checkValidity()).toBe(true);

  el.setAttribute('error', 'Too many');
  await frame();
  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('Too many');
});

test('a disabled field steps nowhere', async () => {
  const el = await mount(`<pf-number-input value="5" disabled></pf-number-input>`);

  await el.stepBy(1);
  await frame();
  expect(el.value).toBe('5');
  expect((part(el, 'increment') as HTMLButtonElement).disabled).toBe(true);
});

/*
 * The steppers are out of the tab order and the arrows are on the input: a
 * keyboard user steps without leaving the field, which is the spinbutton
 * pattern. Tabbing past the field reaches what follows it, not its buttons.
 */
test('the steppers are not tab stops', async () => {
  document.body.innerHTML = `
    <button id="before">before</button>
    <pf-number-input value="5"></pf-number-input>
    <button id="after">after</button>`;
  await customElements.whenDefined('pf-number-input');
  await frame();
  await frame();

  (document.getElementById('before') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Tab}');
  expect((document.activeElement as HTMLElement).tagName.toLowerCase()).toBe('pf-number-input');

  await userEvent.keyboard('{Tab}');
  expect(document.activeElement?.id).toBe('after');
});
