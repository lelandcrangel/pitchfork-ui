/**
 * pf-input is tested in a real browser, all of it.
 *
 * It is form-associated, so it needs a working ElementInternals from its first
 * lifecycle call. Stencil's mock DOM stubs ElementInternals entirely, and
 * jsdom 30 provides `attachInternals()` but neither `setFormValue` nor
 * `setValidity` -- verified, not assumed. There is therefore no environment
 * short of Chromium where any of these assertions can run.
 */
import { expect, test } from 'vitest';
import './pf-input';

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.body.firstElementChild as HTMLElement;
  await customElements.whenDefined('pf-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
};

const control = (root: HTMLElement) => root.shadowRoot?.querySelector('input') ?? null;

test('labels the control from the same root, so `for` actually associates', async () => {
  const root = await mount(`<pf-input label="Email"></pf-input>`);

  expect(root.shadowRoot?.querySelector('label')?.getAttribute('for')).toBe('input');
  expect(control(root)?.id).toBe('input');
});

test('wires aria-describedby to whichever messages are present', async () => {
  const described = await mount(`<pf-input label="Email" description="Hint"></pf-input>`);
  expect(control(described)?.getAttribute('aria-describedby')).toBe('description');

  const both = await mount(`<pf-input label="Email" description="Hint" error="Bad"></pf-input>`);
  expect(control(both)?.getAttribute('aria-describedby')).toBe('description error');
});

test('leaves aria-describedby off when there is nothing to describe', async () => {
  const root = await mount(`<pf-input label="Email"></pf-input>`);

  expect(control(root)?.getAttribute('aria-describedby')).toBeNull();
});

test('marks itself invalid when an error is present', async () => {
  const root = await mount(`<pf-input label="Email" error="Required"></pf-input>`);

  expect(control(root)?.getAttribute('aria-invalid')).toBe('true');
  expect(root.shadowRoot?.querySelector('[part="error"]')?.textContent).toBe('Required');
});

test('participates in a form under its name', async () => {
  document.body.innerHTML = `<form><pf-input name="email" value="a@b.c"></pf-input></form>`;
  const form = document.body.firstElementChild as HTMLFormElement;
  await customElements.whenDefined('pf-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(new FormData(form).get('email')).toBe('a@b.c');
});

test('blocks form submission while a required control is empty', async () => {
  document.body.innerHTML = `<form><pf-input name="email" required></pf-input></form>`;
  const form = document.body.firstElementChild as HTMLFormElement;
  await customElements.whenDefined('pf-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(form.checkValidity()).toBe(false);
});

test('becomes valid once a required control has a value', async () => {
  document.body.innerHTML = `<form><pf-input name="email" required></pf-input></form>`;
  const form = document.body.firstElementChild as HTMLFormElement;
  const el = form.firstElementChild as HTMLElement & { value: string };
  await customElements.whenDefined('pf-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  el.value = 'a@b.c';
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(form.checkValidity()).toBe(true);
});

test('forwards its validity through checkValidity()', async () => {
  const root = (await mount(`<pf-input name="email" required></pf-input>`)) as HTMLElement & {
    checkValidity: () => Promise<boolean>;
  };

  await expect(root.checkValidity()).resolves.toBe(false);
});

test('surfaces an error prop as a custom validity message', async () => {
  const root = (await mount(
    `<pf-input name="email" error="Already taken"></pf-input>`,
  )) as HTMLElement & { getValidationMessage: () => Promise<string> };

  await expect(root.getValidationMessage()).resolves.toBe('Already taken');
});

test('emits pfInput with the new value as the user types', async () => {
  const root = await mount(`<pf-input></pf-input>`);
  const seen: string[] = [];
  root.addEventListener('pfInput', (e) => seen.push((e as CustomEvent).detail.value));

  const native = control(root)!;
  native.value = 'typed';
  native.dispatchEvent(new Event('input'));

  expect(seen).toEqual(['typed']);
});

test('emits pfChange when the value is committed', async () => {
  const root = await mount(`<pf-input value="start"></pf-input>`);
  const seen: string[] = [];
  root.addEventListener('pfChange', (e) => seen.push((e as CustomEvent).detail.value));

  control(root)!.dispatchEvent(new Event('change'));

  expect(seen).toEqual(['start']);
});

/*
 * A reset restores the value the control started with, which is what a native
 * `<input value="initial">` does — verified against one directly. This test
 * previously asserted the value was cleared, which was the defect rather than
 * the contract: a `<pf-input value="…">` lost its value on any form reset.
 */
test('restores its initial value when the form resets', async () => {
  document.body.innerHTML = `<form><pf-input name="email" value="a@b.c"></pf-input></form>`;
  const form = document.body.firstElementChild as HTMLFormElement;
  const el = form.firstElementChild as HTMLElement & { value: string };
  await customElements.whenDefined('pf-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  el.value = 'typed@example.com';
  await new Promise((resolve) => requestAnimationFrame(resolve));

  form.reset();
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(el.value).toBe('a@b.c');
});

test('resets to empty when it started empty', async () => {
  document.body.innerHTML = `<form><pf-input name="email"></pf-input></form>`;
  const form = document.body.firstElementChild as HTMLFormElement;
  const el = form.firstElementChild as HTMLElement & { value: string };
  await customElements.whenDefined('pf-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  el.value = 'typed@example.com';
  await new Promise((resolve) => requestAnimationFrame(resolve));

  form.reset();
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(el.value).toBe('');
});
