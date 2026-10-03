/**
 * Browser-tested in full: form-associated, so neither the mock DOM nor jsdom
 * survives its first lifecycle call.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-tag-input';
import '../pf-tag/pf-tag';

type TagInput = HTMLElement & {
  value: string;
  max?: number;
  allowDuplicates: boolean;
  validate?: (tag: string) => boolean;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-tag-input');
  await customElements.whenDefined('pf-tag');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-tag-input') as TagInput;
};

const until = async (predicate: () => boolean, label = 'pf-tag-input') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const part = (el: TagInput, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const field = (el: TagInput) => part(el, 'input') as HTMLInputElement;
const chips = (el: TagInput) =>
  Array.from(el.shadowRoot?.querySelectorAll('[part="tag"]') ?? []).map((c) =>
    c.textContent?.trim(),
  );

const typeAnd = async (el: TagInput, text: string, key: string) => {
  const input = field(el);
  input.value = text;
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const paste = async (el: TagInput, text: string) => {
  const event = new Event('paste', { bubbles: true, composed: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } });
  field(el).dispatchEvent(event);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('renders a chip per tag in the value', async () => {
  const el = await mount('<pf-tag-input value="alpha,beta"></pf-tag-input>');
  await until(() => chips(el).length === 2, 'two chips');
  expect(chips(el)).toEqual(['alpha', 'beta']);
});

test('Enter commits the draft', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');
  const changes: Array<{ value: string; values: string[] }> = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string; values: string[] }>).detail);
  });

  await typeAnd(el, 'alpha', 'Enter');
  await until(() => el.value === 'alpha', 'Enter to commit');
  expect(changes).toEqual([{ value: 'alpha', values: ['alpha'] }]);
  await until(() => field(el).value === '', 'the draft to clear');
});

test('a comma commits too', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');

  await typeAnd(el, 'beta', ',');
  await until(() => el.value === 'beta', 'a comma to commit');
});

test('trims the draft', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');

  await typeAnd(el, '  spaced  ', 'Enter');
  await until(() => el.value === 'spaced');
});

/* A bare comma with nothing typed is swallowed rather than committing nothing. */
test('an empty draft commits nothing', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');
  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });

  await typeAnd(el, '   ', ',');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(reported).toBe(false);
  expect(el.value).toBe('');
});

/* `React` and `react` are one tag, which is core's rule. */
test('refuses a duplicate regardless of case, and clears the draft', async () => {
  const el = await mount('<pf-tag-input value="React"></pf-tag-input>');
  await until(() => chips(el).length === 1);

  await typeAnd(el, 'react', 'Enter');
  await new Promise((resolve) => setTimeout(resolve, 60));

  expect(el.value).toBe('React');
  // The tag asked for is already there, so the draft has served its purpose.
  expect(field(el).value).toBe('');
});

test('accepts a duplicate when asked', async () => {
  const el = await mount('<pf-tag-input value="react" allow-duplicates></pf-tag-input>');
  await until(() => chips(el).length === 1);

  await typeAnd(el, 'React', 'Enter');
  await until(() => el.value === 'react,React', 'the duplicate to be accepted');
});

/* The maximum leaves the draft alone, so nothing typed is lost. */
test('stops at the maximum and keeps the draft', async () => {
  const el = await mount('<pf-tag-input value="a,b" max="2"></pf-tag-input>');
  await until(() => chips(el).length === 2);

  await typeAnd(el, 'c', 'Enter');
  await new Promise((resolve) => setTimeout(resolve, 60));

  expect(el.value).toBe('a,b');
  expect(field(el).value).toBe('c');
});

test('disables the draft field once the maximum is reached', async () => {
  const el = await mount('<pf-tag-input value="a,b" max="2"></pf-tag-input>');
  await until(() => field(el).disabled === true, 'the field to be disabled at max');
});

test('refuses what validate rejects', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');
  el.validate = (tag: string) => tag.length > 2;

  await typeAnd(el, 'ab', 'Enter');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(el.value).toBe('');

  await typeAnd(el, 'abc', 'Enter');
  await until(() => el.value === 'abc', 'a valid tag to be taken');
});

test('Backspace on an empty draft removes the last tag', async () => {
  const el = await mount('<pf-tag-input value="a,b,c"></pf-tag-input>');
  await until(() => chips(el).length === 3);

  await typeAnd(el, '', 'Backspace');
  await until(() => el.value === 'a,b', 'Backspace to remove the last');
});

test('Backspace with a draft typed leaves the tags alone', async () => {
  const el = await mount('<pf-tag-input value="a,b"></pf-tag-input>');
  await until(() => chips(el).length === 2);

  await typeAnd(el, 'draft', 'Backspace');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(el.value).toBe('a,b');
});

test("a chip's dismiss button removes that tag", async () => {
  const el = await mount('<pf-tag-input value="a,b,c"></pf-tag-input>');
  await until(() => chips(el).length === 3);

  const middle = el.shadowRoot?.querySelectorAll('[part="tag"]')[1] as HTMLElement;
  const dismiss = middle.shadowRoot?.querySelector('button') as HTMLButtonElement;
  dismiss.click();

  await until(() => el.value === 'a,c', 'the chip to be removed');
});

// ─── Pasting, which the React component got wrong ───────────────────────────

/*
 * Every tag, not just the last. The React component added them in a loop whose
 * helper read the same closed-over state each time, so only the final one
 * survived — fixed there in this change, with three tests that fail against
 * the old handler.
 */
test('adds every tag from a pasted list', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');

  await paste(el, 'alpha, beta, gamma');
  await until(() => el.value === 'alpha,beta,gamma', 'all three to be added');
});

test('splits a pasted list on newlines and tabs too', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');

  await paste(el, 'alpha\nbeta\tgamma');
  await until(() => el.value === 'alpha,beta,gamma');
});

test('applies the maximum across a pasted list', async () => {
  const el = await mount('<pf-tag-input max="2"></pf-tag-input>');

  await paste(el, 'alpha, beta, gamma');
  await until(() => el.value === 'alpha,beta', 'the maximum to hold');
});

test('dedupes within a pasted list', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');

  await paste(el, 'alpha, Alpha, beta');
  await until(() => el.value === 'alpha,beta', 'the dedup to hold across the paste');
});

/* Text with no separator is left to the browser, so it lands in the draft. */
test('leaves an ordinary paste alone', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');

  await paste(el, 'one tag');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(el.value).toBe('');
});

test('commits a typed draft on blur, so it is not lost', async () => {
  const el = await mount('<pf-tag-input></pf-tag-input>');

  field(el).value = 'onblur';
  field(el).dispatchEvent(new Event('blur', { bubbles: true, composed: true }));

  await until(() => el.value === 'onblur', 'blur to commit the draft');
});

// ─── Form association ───────────────────────────────────────────────────────

test('submits one entry per tag, under one name', async () => {
  document.body.innerHTML = `
    <form id="f"><pf-tag-input name="tags" value="alpha,beta"></pf-tag-input></form>`;
  await customElements.whenDefined('pf-tag-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect(data.getAll('tags')).toEqual(['alpha', 'beta']);
});

test('reflects a name assigned after load', async () => {
  document.body.innerHTML = `<form id="f"><pf-tag-input value="alpha"></pf-tag-input></form>`;
  await customElements.whenDefined('pf-tag-input');
  const el = document.querySelector('pf-tag-input') as TagInput & { name: string };
  await until(() => el.shadowRoot?.querySelector('[part="input"]') !== null, 'it to render');
  await new Promise((resolve) => setTimeout(resolve, 60));

  el.name = 'tags';
  await until(
    () => new FormData(document.getElementById('f') as HTMLFormElement).has('tags'),
    'the submission to pick the name up',
  );
  expect(new FormData(document.getElementById('f') as HTMLFormElement).getAll('tags')).toEqual([
    'alpha',
  ]);
});

test('is absent from the submission with no tags', async () => {
  document.body.innerHTML = `<form id="f"><pf-tag-input name="tags"></pf-tag-input></form>`;
  await customElements.whenDefined('pf-tag-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([]);
});

test('a form reset restores the tags it started with', async () => {
  document.body.innerHTML = `
    <form id="f"><pf-tag-input name="tags" value="alpha,beta"></pf-tag-input></form>`;
  await customElements.whenDefined('pf-tag-input');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-tag-input') as TagInput;

  el.value = 'gamma';
  await until(() => el.value === 'gamma');

  (document.getElementById('f') as HTMLFormElement).reset();
  await until(() => el.value === 'alpha,beta', 'the reset to restore the tags');
});

test('a required field with no tags is invalid, and says why', async () => {
  const el = await mount('<pf-tag-input name="tags" required></pf-tag-input>');

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = 'alpha';
  await until(() => el.value === 'alpha');
  expect(await el.checkValidity()).toBe(true);
});

test('an error message wins over the required message', async () => {
  const el = await mount('<pf-tag-input name="tags" required error="At least one"></pf-tag-input>');

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('At least one');
});

test('labels the draft field', async () => {
  const el = await mount('<pf-tag-input label="Tags"></pf-tag-input>');

  expect((part(el, 'label') as HTMLLabelElement).htmlFor).toBe('input');
  expect(field(el).id).toBe('input');
});

test('a disabled field takes no tags and offers no dismiss buttons', async () => {
  const el = await mount('<pf-tag-input value="a" disabled></pf-tag-input>');
  await until(() => chips(el).length === 1);

  await typeAnd(el, 'b', 'Enter');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(el.value).toBe('a');

  const chip = el.shadowRoot?.querySelector('[part="tag"]') as HTMLElement;
  expect(chip.hasAttribute('dismissible')).toBe(false);
});
