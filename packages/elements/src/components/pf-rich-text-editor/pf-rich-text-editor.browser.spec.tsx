/**
 * All of it, in the browser. A form-associated component throws on its first
 * lifecycle call anywhere else, and the three things this element does beyond
 * markup — `document.execCommand`, a `contenteditable`'s own `input` event,
 * and a roving tabindex over real focus — are none of them in the mock DOM.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-rich-text-editor';

type Editor = HTMLElement & {
  value: string;
  characterMax?: number;
  required: boolean;
  disabled: boolean;
  error?: string;
  format(command: string): Promise<void>;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (attrs = '', wrap = (html: string) => html) => {
  document.body.innerHTML = wrap(`<pf-rich-text-editor ${attrs}></pf-rich-text-editor>`);
  await customElements.whenDefined('pf-rich-text-editor');
  await frame();
  await frame();
  return document.querySelector('pf-rich-text-editor') as Editor;
};

const until = async (predicate: () => boolean, label = 'pf-rich-text-editor') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Editor, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;
const tools = (el: Editor) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLButtonElement>("[part='tool']"));
const tool = (el: Editor, command: string) =>
  el.shadowRoot!.querySelector(`[data-command='${command}']`) as HTMLButtonElement;
const editor = (el: Editor) => part(el, 'editor');

/** Types into the contenteditable the way the person does: text plus `input`. */
const typeInto = (el: Editor, html: string) => {
  editor(el).innerHTML = html;
  editor(el).dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('it is a multiline textbox with a named toolbar', async () => {
  const el = await mount('label="Notes"');

  expect(editor(el).getAttribute('role')).toBe('textbox');
  expect(editor(el).getAttribute('aria-multiline')).toBe('true');
  expect(editor(el).isContentEditable).toBe(true);
  expect(part(el, 'toolbar').getAttribute('role')).toBe('toolbar');
  expect(part(el, 'toolbar').getAttribute('aria-label')).toBe('Formatting options');
});

/* A `label[for]` cannot name a div, so the name comes from an IDREF. */
test('the label names the textbox through a same-root IDREF', async () => {
  const el = await mount('label="Notes"');
  const id = editor(el).getAttribute('aria-labelledby');

  expect(id).toBe('label');
  expect(el.shadowRoot!.getElementById(id as string)?.textContent).toContain('Notes');
});

test('it offers core’s six commands, with one divider', async () => {
  const el = await mount();

  expect(tools(el).map((button) => button.getAttribute('data-command'))).toEqual([
    'bold',
    'italic',
    'underline',
    'insertUnorderedList',
    'insertOrderedList',
    'removeFormat',
  ]);
  expect(el.shadowRoot!.querySelectorAll('.divider')).toHaveLength(1);
});

/*
 * The ARIA toolbar pattern: one tab stop from outside, the arrows moving
 * inside. The React component is six tab stops inside a `role="toolbar"`.
 */
test('the toolbar is one tab stop and the arrows move inside it', async () => {
  const el = await mount();
  const buttons = tools(el);

  expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
  expect(buttons[0].tabIndex).toBe(0);

  buttons[0].focus();
  await userEvent.keyboard('{ArrowRight}');
  await until(() => el.shadowRoot!.activeElement === buttons[1], 'the next button');

  await userEvent.keyboard('{End}');
  await until(
    () => el.shadowRoot!.activeElement === buttons[buttons.length - 1],
    'the last button',
  );

  await userEvent.keyboard('{Home}');
  await until(() => el.shadowRoot!.activeElement === buttons[0], 'the first button');

  // The tab stop follows the focus, so Tab back in returns to where it was.
  buttons[2].focus();
  await until(() => buttons[2].tabIndex === 0, 'the tab stop to follow');
  expect(buttons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
});

/* The caret has to stay in the editor, or a command has nothing to apply to. */
test('pressing a tool does not take the caret out of the editor', async () => {
  const el = await mount();
  const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
  tool(el, 'bold').dispatchEvent(down);

  expect(down.defaultPrevented).toBe(true);
});

/*
 * `document.execCommand` is deprecated and still the only way to format
 * inside a `contenteditable` without a dependency. The mock DOM has none of
 * it, which is why this is here.
 */
test('bold wraps the selection and the value follows', async () => {
  const el = await mount();
  const heard: string[] = [];
  el.addEventListener('pfChange', (event) =>
    heard.push((event as CustomEvent<{ value: string }>).detail.value),
  );

  typeInto(el, 'hello');
  await until(() => el.value === 'hello', 'the typed value');

  // Select it all, then bold it.
  const range = document.createRange();
  range.selectNodeContents(editor(el));
  const selection = el.shadowRoot!.getSelection?.() ?? window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  await el.format('bold');
  await until(() => /<(b|strong)>/i.test(el.value), 'the bold markup');
  expect(editor(el).textContent).toBe('hello');
  expect(heard[heard.length - 1]).toBe(el.value);
});

test('a list command produces a list', async () => {
  const el = await mount();
  typeInto(el, 'one');
  await until(() => el.value === 'one', 'the typed value');

  const range = document.createRange();
  range.selectNodeContents(editor(el));
  const selection = el.shadowRoot!.getSelection?.() ?? window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  await el.format('insertUnorderedList');
  await until(() => editor(el).querySelector('ul li') !== null, 'the list');
});

test('a disabled editor is not editable and its tools are off', async () => {
  const el = await mount('disabled');

  expect(editor(el).isContentEditable).toBe(false);
  expect(editor(el).getAttribute('aria-disabled')).toBe('true');
  expect(tools(el).every((button) => button.disabled)).toBe(true);

  await el.format('bold');
  expect(el.value).toBe('');
});

/* ── The value, and the limit ───────────────────────────────────────────── */

/*
 * The editable area's content is set imperatively, never rendered: a vdom
 * that also owned it would put the old content back under the person's caret
 * on the next render.
 */
test('a value set from outside reaches the box', async () => {
  const el = await mount();

  el.value = '<strong>bold</strong> text';
  await until(() => editor(el).innerHTML === '<strong>bold</strong> text', 'the written value');
});

/*
 * Core's normalisation, which fixed a live defect: the React version's four
 * conditions are all true of two paragraphs, which it cut into the broken
 * fragment `a</p><p>b`.
 */
test('a single wrapping paragraph is dropped and two are kept', async () => {
  const one = await mount('value="<p>hello</p>"');
  expect(editor(one).innerHTML).toBe('hello');

  document.body.innerHTML = '';
  const two = await mount('value="<p>a</p><p>b</p>"');
  expect(editor(two).innerHTML).toBe('<p>a</p><p>b</p>');
  expect(editor(two).querySelectorAll('p')).toHaveLength(2);
});

test('the counter follows the text, not the markup', async () => {
  const el = await mount('character-max="20"');

  expect(part(el, 'count').textContent).toBe('0/20');

  typeInto(el, '<strong>abc</strong>');
  await until(() => part(el, 'count').textContent === '3/20', 'the count');
});

test('the counter describes the textbox', async () => {
  const el = await mount('character-max="20"');
  expect(editor(el).getAttribute('aria-describedby')).toContain('count');
});

/* Over the limit, the last value inside it comes back. */
test('it refuses text past the character limit', async () => {
  const el = await mount('character-max="5"');

  typeInto(el, 'abcde');
  await until(() => el.value === 'abcde', 'the value at the limit');

  typeInto(el, 'abcdefgh');
  await frame();
  await frame();

  expect(editor(el).textContent).toBe('abcde');
  expect(el.value).toBe('abcde');
});

/* ── The form half ──────────────────────────────────────────────────────── */

test('the value reaches the submission under its name', async () => {
  const el = await mount('name="notes"', (html) => `<form>${html}</form>`);
  const form = document.querySelector('form') as HTMLFormElement;

  typeInto(el, '<em>hi</em>');
  await until(() => el.value === '<em>hi</em>', 'the typed value');

  expect(new FormData(form).get('notes')).toBe('<em>hi</em>');
});

/*
 * Required is about *text*, not markup: a browser left to itself puts `<br>`
 * or an empty paragraph in an emptied contenteditable, so a markup test would
 * call an empty field filled.
 */
test('required is unsatisfied by markup with no text in it', async () => {
  const el = await mount('name="notes" required', (html) => `<form>${html}</form>`);

  expect(await el.checkValidity()).toBe(false);

  typeInto(el, '<p><br></p>');
  await frame();
  expect(await el.checkValidity()).toBe(false);

  typeInto(el, '<p>words</p>');
  await until(() => el.value.includes('words'), 'the text');
  expect(await el.checkValidity()).toBe(true);
});

test('a consumer error marks it invalid with their own message', async () => {
  const el = await mount('name="notes" error="Too short for review."');

  expect(part(el, 'error').textContent).toBe('Too short for review.');
  expect(editor(el).getAttribute('aria-invalid')).toBe('true');
  expect(await el.getValidationMessage()).toBe('Too short for review.');
});

/* A reset restores the value the control started with, not an empty one. */
test('a reset restores the value it started with', async () => {
  const el = await mount('name="notes" value="start"', (html) => `<form>${html}</form>`);
  const form = document.querySelector('form') as HTMLFormElement;

  typeInto(el, 'changed');
  await until(() => el.value === 'changed', 'the change');

  form.reset();
  await until(() => el.value === 'start', 'the reset');
  expect(editor(el).innerHTML).toBe('start');
});

/* The placeholder is CSS on `:empty`, so it needs the box to really be empty. */
test('the placeholder is set as data for the stylesheet to show', async () => {
  const el = await mount('placeholder="Write something"');
  expect(editor(el).getAttribute('data-placeholder')).toBe('Write something');
});
