/**
 * pf-switch is tested in a real browser, all of it.
 *
 * It is form-associated, so it needs a working ElementInternals from its first
 * lifecycle call. Stencil's mock DOM stubs ElementInternals entirely, and
 * jsdom 30 provides `attachInternals()` but neither `setFormValue` nor
 * `setValidity` — so there is no environment short of Chromium where any of
 * these assertions can run. The mock DOM also reads `input.checked` as
 * `undefined`, which would make half of them vacuous.
 */
import { expect, test } from 'vitest';
import './pf-switch';

type Switch = HTMLElement & {
  checked: boolean;
  value: string;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-switch');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.body.firstElementChild as Switch;
};

const until = async (predicate: () => boolean) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for pf-switch');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const input = (el: Switch) => el.shadowRoot?.querySelector('input') as HTMLInputElement;
const submitted = (form: HTMLFormElement) => [...new FormData(form).entries()];

test('carries role=switch, which is the only difference from a checkbox', async () => {
  const el = await mount(`<pf-switch label="Notifications"></pf-switch>`);

  expect(input(el).getAttribute('role')).toBe('switch');
  expect(input(el).type).toBe('checkbox');
});

test('labels the control from the same root, so `for` actually associates', async () => {
  const el = await mount(`<pf-switch label="Accept terms"></pf-switch>`);

  expect(el.shadowRoot?.querySelector('label')?.getAttribute('for')).toBe('input');
  expect(input(el).id).toBe('input');
});

test('a click on the label toggles the switch', async () => {
  const el = await mount(`<pf-switch label="Accept"></pf-switch>`);
  expect(el.checked).toBe(false);

  (el.shadowRoot?.querySelector('label') as HTMLLabelElement).click();
  await until(() => el.checked);

  expect(input(el).checked).toBe(true);
});

test('reports the user’s change through pfChange', async () => {
  const el = await mount(`<pf-switch value="yes"></pf-switch>`);
  const seen: Array<{ checked: boolean; value: string }> = [];
  el.addEventListener('pfChange', (event) => {
    seen.push((event as CustomEvent<{ checked: boolean; value: string }>).detail);
  });

  input(el).click();
  await until(() => seen.length > 0);

  expect(seen).toEqual([{ checked: true, value: 'yes' }]);
});

/*
 * The whole reason this is form-associated: a plain <input> in a shadow root
 * never reaches the surrounding form.
 */
test('its value reaches the surrounding form', async () => {
  document.body.innerHTML = `<form><pf-switch name="terms" value="accepted" checked></pf-switch></form>`;
  await customElements.whenDefined('pf-switch');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const form = document.querySelector('form') as HTMLFormElement;

  expect(submitted(form)).toEqual([['terms', 'accepted']]);
});

/*
 * An unticked checkbox is absent from the submission, not present and empty —
 * which is how a server tells "unticked" from "field not sent".
 */
test('an unticked box is absent from the submission entirely', async () => {
  document.body.innerHTML = `<form><pf-switch name="terms" value="accepted"></pf-switch></form>`;
  await customElements.whenDefined('pf-switch');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const form = document.querySelector('form') as HTMLFormElement;

  expect(submitted(form)).toEqual([]);
});

test('submits "on" when no value was given, like a native checkbox', async () => {
  document.body.innerHTML = `<form><pf-switch name="terms" checked></pf-switch></form>`;
  await customElements.whenDefined('pf-switch');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(submitted(document.querySelector('form') as HTMLFormElement)).toEqual([['terms', 'on']]);
});

test('a required box is invalid until it is ticked', async () => {
  const el = await mount(`<pf-switch name="terms" required></pf-switch>`);

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.checked = true;
  await until(() => input(el).checked);

  expect(await el.checkValidity()).toBe(true);
});

/* A consumer who set an error has already decided what to say. */
test('an explicit error wins over the required message', async () => {
  const el = await mount(`<pf-switch required error="You must agree first."></pf-switch>`);

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('You must agree first.');
});

test('an error marks the control invalid for assistive technology', async () => {
  const el = await mount(`<pf-switch error="Required"></pf-switch>`);

  expect(input(el).getAttribute('aria-invalid')).toBe('true');
  expect(input(el).getAttribute('aria-describedby')).toBe('error');
  expect(el.shadowRoot?.querySelector('[part="error"]')?.id).toBe('error');
});

test('no error leaves aria-invalid off rather than false', async () => {
  const el = await mount(`<pf-switch></pf-switch>`);

  expect(input(el).getAttribute('aria-invalid')).toBeNull();
  expect(input(el).getAttribute('aria-describedby')).toBeNull();
});

/*
 * A native <input type=checkbox checked> comes back ticked after a reset, not
 * unticked — verified directly against one before writing this.
 */
test('a reset restores the initial state, not false', async () => {
  document.body.innerHTML = `<form><pf-switch name="a" checked></pf-switch></form>`;
  await customElements.whenDefined('pf-switch');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const form = document.querySelector('form') as HTMLFormElement;
  const el = document.querySelector('pf-switch') as Switch;

  el.checked = false;
  await until(() => !input(el).checked);

  form.reset();
  await until(() => el.checked);

  expect(submitted(form)).toEqual([['a', 'on']]);
});

test('a reset leaves an initially unticked box unticked', async () => {
  document.body.innerHTML = `<form><pf-switch name="a"></pf-switch></form>`;
  await customElements.whenDefined('pf-switch');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const form = document.querySelector('form') as HTMLFormElement;
  const el = document.querySelector('pf-switch') as Switch;

  el.checked = true;
  await until(() => input(el).checked);

  form.reset();
  await until(() => !el.checked);

  expect(submitted(form)).toEqual([]);
});

test('a disabled box cannot be toggled by the user', async () => {
  const el = await mount(`<pf-switch disabled></pf-switch>`);

  expect(input(el).disabled).toBe(true);
  input(el).click();
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(el.checked).toBe(false);
});

test('reflects checked so the stylesheet can select on it', async () => {
  const el = await mount(`<pf-switch></pf-switch>`);
  expect(el.hasAttribute('checked')).toBe(false);

  el.checked = true;
  await until(() => el.hasAttribute('checked'));
});
