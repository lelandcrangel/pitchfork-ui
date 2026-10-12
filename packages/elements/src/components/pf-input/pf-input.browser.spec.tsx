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

/*
 * Naming the control with no visible label. The React `Input` extends
 * `InputHTMLAttributes`, so `aria-label` lands on the real `<input>`; here it
 * lands on the **host**, and the host is not the control. Without the bridge
 * in `src/control-label.ts` the `<input>` has no accessible name at all and
 * nothing says so -- measured against Chromium's accessibility tree through
 * CDP, where the host reported the name and the textbox inside it reported
 * none, for all 13 labelled controls. `scripts/smoke-consumer.mjs` reads the
 * tree; this reads the attribute the tree is built from.
 */
test('copies the host aria-label onto the control when there is no visible label', async () => {
  const root = await mount(`<pf-input aria-label="Custom font stack"></pf-input>`);

  expect(root.shadowRoot?.querySelector('label')).toBeNull();
  expect(control(root)?.getAttribute('aria-label')).toBe('Custom font stack');
});

/*
 * A visible label wins. It is both the name and a `for` target in the
 * control's own root -- the kind of reference that resolves -- so copying an
 * `aria-label` over it would override the visible text with something a
 * sighted reader cannot see.
 */
test('a visible label wins over a host aria-label', async () => {
  const root = await mount(`<pf-input label="Email" aria-label="Something else"></pf-input>`);

  expect(root.shadowRoot?.querySelector('label')?.textContent).toContain('Email');
  expect(control(root)?.getAttribute('aria-label')).toBeNull();
});

test('ignores a blank host aria-label rather than naming the control with it', async () => {
  const root = await mount(`<pf-input aria-label="   "></pf-input>`);

  expect(control(root)?.getAttribute('aria-label')).toBeNull();
});
