/**
 * pf-textarea is tested in a real browser, all of it — it is form-associated,
 * so ElementInternals has to be real from its first lifecycle call.
 */
import { expect, test } from 'vitest';
import './pf-textarea';

type Textarea = HTMLElement & {
  value: string;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-textarea');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.body.firstElementChild as Textarea;
};

const until = async (predicate: () => boolean) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for pf-textarea');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const control = (el: Textarea) => el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

test('labels the control from the same root, so `for` actually associates', async () => {
  const el = await mount(`<pf-textarea label="Notes"></pf-textarea>`);

  expect(el.shadowRoot?.querySelector('label')?.getAttribute('for')).toBe('input');
  expect(control(el).id).toBe('input');
});

test('honours rows, which is what makes it multi-line', async () => {
  const el = await mount(`<pf-textarea rows="8"></pf-textarea>`);

  expect(control(el).rows).toBe(8);
});

/*
 * A textarea's value is its text content, not an attribute, so it is written
 * through the DOM property rather than rendered as a JSX child — Stencil would
 * otherwise replace that text node on every keystroke.
 */
test('writes an initial value onto the control', async () => {
  const el = await mount(`<pf-textarea value="hello"></pf-textarea>`);

  expect(control(el).value).toBe('hello');
});

test('pushes a programmatic value down to the control', async () => {
  const el = await mount(`<pf-textarea></pf-textarea>`);

  el.value = 'set from script';
  await until(() => control(el).value === 'set from script');
});

/*
 * The guard on inequality, asserted as the mechanism rather than as its
 * symptom. Reassigning a textarea's value is what moves the caret to the end
 * in engines that do so — Chromium is not one of them, so a caret assertion
 * here would pass with the guard removed and prove nothing. Spying on the
 * setter tests the thing the guard actually promises: an unrelated re-render
 * does not touch the value at all.
 */
test('does not rewrite the value on a re-render that did not change it', async () => {
  const el = await mount(`<pf-textarea value="abcdef"></pf-textarea>`);
  const native = control(el);

  const writes: string[] = [];
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  ) as PropertyDescriptor;
  Object.defineProperty(native, 'value', {
    configurable: true,
    get: () => descriptor.get!.call(native),
    set: (next: string) => {
      writes.push(next);
      descriptor.set!.call(native, next);
    },
  });

  // A re-render provoked by something other than the value.
  el.setAttribute('rows', '6');
  await until(() => native.rows === 6);

  expect(writes).toEqual([]);

  // And it still writes when the value really does change.
  el.value = 'changed';
  await until(() => native.value === 'changed');

  expect(writes).toEqual(['changed']);
});

test('reports typing through pfInput and commits through pfChange', async () => {
  const el = await mount(`<pf-textarea></pf-textarea>`);
  const typed: string[] = [];
  const committed: string[] = [];
  el.addEventListener('pfInput', (e) =>
    typed.push((e as CustomEvent<{ value: string }>).detail.value),
  );
  el.addEventListener('pfChange', (e) =>
    committed.push((e as CustomEvent<{ value: string }>).detail.value),
  );

  const native = control(el);
  native.value = 'draft';
  native.dispatchEvent(new Event('input'));
  native.dispatchEvent(new Event('change'));
  await until(() => committed.length > 0);

  expect(typed).toEqual(['draft']);
  expect(committed).toEqual(['draft']);
});

test('its value reaches the surrounding form', async () => {
  document.body.innerHTML = `<form><pf-textarea name="notes" value="typed"></pf-textarea></form>`;
  await customElements.whenDefined('pf-textarea');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect([...new FormData(document.querySelector('form') as HTMLFormElement).entries()]).toEqual([
    ['notes', 'typed'],
  ]);
});

test('a required empty textarea is invalid until it has content', async () => {
  const el = await mount(`<pf-textarea name="notes" required></pf-textarea>`);

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = 'something';
  await until(() => control(el).value === 'something');

  expect(await el.checkValidity()).toBe(true);
});

test('an explicit error wins over the required message', async () => {
  const el = await mount(`<pf-textarea required error="Tell us more."></pf-textarea>`);

  expect(await el.getValidationMessage()).toBe('Tell us more.');
});

test('wires aria-describedby to whichever messages are present', async () => {
  const both = await mount(
    `<pf-textarea description="Markdown ok" error="Too short"></pf-textarea>`,
  );
  expect(control(both).getAttribute('aria-describedby')).toBe('description error');
  expect(control(both).getAttribute('aria-invalid')).toBe('true');

  const neither = await mount(`<pf-textarea></pf-textarea>`);
  expect(control(neither).getAttribute('aria-describedby')).toBeNull();
  expect(control(neither).getAttribute('aria-invalid')).toBeNull();
});

test('restores its initial value when the form resets', async () => {
  document.body.innerHTML = `<form><pf-textarea name="notes" value="original"></pf-textarea></form>`;
  await customElements.whenDefined('pf-textarea');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const form = document.querySelector('form') as HTMLFormElement;
  const el = document.querySelector('pf-textarea') as Textarea;

  el.value = 'edited';
  await until(() => control(el).value === 'edited');

  form.reset();
  await until(() => el.value === 'original');
});
