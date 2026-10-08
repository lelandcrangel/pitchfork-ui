/**
 * All of it, in the browser: a form-associated component throws on its first
 * lifecycle call anywhere else — the mock DOM stubs `ElementInternals` and
 * jsdom 30 has `attachInternals()` but neither `setFormValue` nor
 * `setValidity` — and the drag, the picker and the keys need a real DOM
 * besides.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-file-uploader';

type Uploader = HTMLElement & {
  files: File[];
  name?: string;
  accept?: string;
  multiple: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  required: boolean;
  disabled: boolean;
  error?: string;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (attrs = '', wrap = (html: string) => html) => {
  document.body.innerHTML = wrap(`<pf-file-uploader ${attrs}></pf-file-uploader>`);
  await customElements.whenDefined('pf-file-uploader');
  await frame();
  await frame();
  return document.querySelector('pf-file-uploader') as Uploader;
};

const until = async (predicate: () => boolean, label = 'pf-file-uploader') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Uploader, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;
const rows = (el: Uploader) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>("[part='file']"));
const input = (el: Uploader) =>
  el.shadowRoot!.querySelector('input[type=file]') as HTMLInputElement;
const errorText = (el: Uploader) => part(el, 'error')?.textContent?.trim();

const file = (name: string, type = 'application/pdf', size = 4) =>
  new File(['x'.repeat(size)], name, { type, lastModified: 1 });

/** A drop, which needs a DataTransfer carrying real files. */
const drop = (el: Uploader, files: File[], type = 'drop') => {
  const data = new DataTransfer();
  for (const item of files) data.items.add(item);
  const event = new DragEvent(type, { dataTransfer: data, bubbles: true, cancelable: true });
  part(el, 'dropzone').dispatchEvent(event);
  return event;
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('it renders a dropzone that names itself and its limits', async () => {
  const el = await mount('label="Attachments" accept=".pdf" max-files="2" max-file-size="1024"');
  const zone = part(el, 'dropzone');

  expect(zone.tagName.toLowerCase()).toBe('button');
  expect(zone.textContent).toContain('Upload files');
  expect(zone.textContent).toContain('Accepted: .pdf | Max size: 1.0 KB | Max files: 2');
  expect(part(el, 'label').textContent).toContain('Attachments');
});

/*
 * The input is in the shadow root, so it reaches no surrounding form of its
 * own. Giving it a `name` would be the tell that someone expected it to.
 */
test('the inner input is out of the way and nameless', async () => {
  const el = await mount('name="docs"');
  const picker = input(el);

  expect(picker.hasAttribute('name')).toBe(false);
  expect(picker.getAttribute('aria-hidden')).toBe('true');
  expect(picker.tabIndex).toBe(-1);
});

test('a dropped file is held, listed and reported', async () => {
  const el = await mount();
  const heard: File[][] = [];
  el.addEventListener('pfChange', (event) =>
    heard.push((event as CustomEvent<{ files: File[] }>).detail.files),
  );

  drop(el, [file('report.pdf')]);
  await until(() => rows(el).length === 1, 'the file row');

  expect(rows(el)[0].textContent).toContain('report.pdf');
  expect(rows(el)[0].textContent).toContain('4 B');
  expect(heard).toHaveLength(1);
  expect(heard[0][0].name).toBe('report.pdf');
});

/*
 * `accept` filters the file picker and nothing else: a dropped file passes no
 * filter at all, so the uploader has to check it. Core's rule, shared with
 * the React component, which had the same gap.
 */
test('a dropped file of the wrong kind is refused', async () => {
  const el = await mount('accept=".pdf"');
  const rejections: string[] = [];
  el.addEventListener('pfReject', (event) =>
    rejections.push((event as CustomEvent<{ message: string }>).detail.message),
  );

  drop(el, [file('virus.exe', 'application/x-msdownload')]);
  await until(() => Boolean(errorText(el)), 'the rejection');

  expect(errorText(el)).toContain('not an accepted file type');
  expect(rejections).toHaveLength(1);
  expect(el.files).toHaveLength(0);
  expect(part(el, 'dropzone').getAttribute('aria-invalid')).toBe('true');
});

test('a file over the size limit is refused by name', async () => {
  const el = await mount('max-file-size="2"');

  drop(el, [file('big.pdf', 'application/pdf', 10)]);
  await until(() => Boolean(errorText(el)), 'the rejection');

  expect(errorText(el)).toBe('"big.pdf" exceeds the 2 B size limit.');
});

/*
 * The selection is refused rather than quietly cut to size. The React
 * component truncated first and validated the truncated list, which made its
 * own message unreachable.
 */
test('a selection over maxFiles is refused rather than trimmed', async () => {
  const el = await mount('max-files="2"');

  drop(el, [file('a.pdf'), file('b.pdf'), file('c.pdf')]);
  await until(() => Boolean(errorText(el)), 'the rejection');

  expect(errorText(el)).toBe('You can upload up to 2 files.');
  expect(el.files).toHaveLength(0);
});

/*
 * A file input fires no `change` for an identical selection, so a rejected
 * value left in place means picking the same file again does nothing.
 *
 * This has to go through the *picker*, not a drop: a drop never populates the
 * input, so the same assertion made after a drop passes whether the clearing
 * happens or not. `input.files` is settable from a `DataTransfer`, which is
 * the only way to drive the picker without one.
 */
test('the inner input is cleared after a refusal', async () => {
  const el = await mount('max-file-size="2"');
  const picker = input(el);

  const data = new DataTransfer();
  data.items.add(file('big.pdf', 'application/pdf', 10));
  picker.files = data.files;
  expect(picker.value).not.toBe('');

  picker.dispatchEvent(new Event('change', { bubbles: true }));
  await until(() => Boolean(errorText(el)), 'the rejection');

  expect(picker.value).toBe('');
});

/* And after an accepted selection, for the same reason. */
test('the inner input is cleared after an accepted selection', async () => {
  const el = await mount();
  const picker = input(el);

  const data = new DataTransfer();
  data.items.add(file('a.pdf'));
  picker.files = data.files;
  picker.dispatchEvent(new Event('change', { bubbles: true }));

  await until(() => el.files.length === 1, 'the file');
  expect(picker.value).toBe('');
});

test('re-dropping a file already held changes nothing', async () => {
  const el = await mount();

  drop(el, [file('report.pdf')]);
  await until(() => rows(el).length === 1, 'the first drop');
  drop(el, [file('report.pdf')]);
  await frame();
  await frame();

  expect(rows(el)).toHaveLength(1);
});

test('a single picker replaces rather than appends', async () => {
  const el = await mount('multiple="false"');

  drop(el, [file('a.pdf')]);
  await until(() => rows(el).length === 1, 'the first drop');
  drop(el, [file('b.pdf')]);
  await until(() => rows(el)[0].textContent?.includes('b.pdf') ?? false, 'the replacement');

  expect(rows(el)).toHaveLength(1);
});

test('a row can be removed, and says which file it removes', async () => {
  const el = await mount();

  drop(el, [file('a.pdf'), file('b.pdf')]);
  await until(() => rows(el).length === 2, 'both files');

  const remove = rows(el)[0].querySelector("[part='remove']") as HTMLButtonElement;
  expect(remove.getAttribute('aria-label')).toBe('Remove a.pdf');

  await userEvent.click(remove);
  await until(() => rows(el).length === 1, 'the removal');
  expect(rows(el)[0].textContent).toContain('b.pdf');
});

/*
 * `dragenter` and `dragleave` both bubble from the dropzone's own children, so
 * moving from the icon to the title fires a leave and then an enter — a
 * boolean flickers off and the React component's does.
 */
test('the drag highlight survives moving between the dropzone’s children', async () => {
  const el = await mount();
  const zone = part(el, 'dropzone');
  const icon = part(el, 'icon');
  const active = () => zone.className.includes('dropzone--active');

  const enter = (node: Element) =>
    node.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true }));
  const leave = (node: Element) =>
    node.dispatchEvent(new DragEvent('dragleave', { bubbles: true, cancelable: true }));

  enter(zone);
  await until(active, 'the highlight');

  // Into a child, which is a leave on the zone followed by an enter.
  enter(icon);
  leave(zone);
  await frame();
  await frame();
  expect(active()).toBe(true);

  // Out of the uploader for real: every enter has now been matched.
  leave(icon);
  leave(zone);
  await until(() => !active(), 'the highlight to go');
});

test('a drop clears the highlight even from mid-drag', async () => {
  const el = await mount();
  const zone = part(el, 'dropzone');

  zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true }));
  zone.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true }));
  await until(() => zone.className.includes('dropzone--active'), 'the highlight');

  drop(el, [file('a.pdf')]);
  await until(() => !zone.className.includes('dropzone--active'), 'the highlight to go');
});

/* The drop has to be prevented, or the browser navigates to the file. */
test('it prevents the drop and the dragover', async () => {
  const el = await mount();
  const over = new DragEvent('dragover', { bubbles: true, cancelable: true });
  part(el, 'dropzone').dispatchEvent(over);

  expect(over.defaultPrevented).toBe(true);
  expect(drop(el, [file('a.pdf')]).defaultPrevented).toBe(true);
});

test('a disabled uploader takes nothing', async () => {
  const el = await mount('disabled');

  drop(el, [file('a.pdf')]);
  await frame();
  await frame();

  expect(el.files).toHaveLength(0);
  expect((part(el, 'dropzone') as HTMLButtonElement).disabled).toBe(true);
});

/* ── The form half ──────────────────────────────────────────────────────── */

/*
 * One control submitting one entry per file, which is how a native multi-file
 * input submits — and `setFormValue` ignores the element's own `name` when
 * handed a `FormData`, so the key is built into it.
 */
test('every file reaches the submission under the control’s name', async () => {
  const el = await mount('name="docs"', (html) => `<form>${html}</form>`);
  const form = document.querySelector('form') as HTMLFormElement;

  drop(el, [file('a.pdf'), file('b.pdf')]);
  await until(() => el.files.length === 2, 'both files');

  const data = new FormData(form);
  const names = data.getAll('docs').map((entry) => (entry as File).name);
  expect(names).toEqual(['a.pdf', 'b.pdf']);
});

/*
 * Nothing chosen is absent from the submission entirely, not present and
 * empty — the rule a native file input follows, and the same reason
 * `pf-checkbox` sets `null` rather than `''`.
 */
test('an empty uploader is absent from the submission', async () => {
  const el = await mount('name="docs"', (html) => `<form>${html}</form>`);
  const form = document.querySelector('form') as HTMLFormElement;

  expect(el.files).toHaveLength(0);
  expect(new FormData(form).has('docs')).toBe(false);
});

test('required is unsatisfied until a file is chosen', async () => {
  const el = await mount('name="docs" required', (html) => `<form>${html}</form>`);

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  drop(el, [file('a.pdf')]);
  await until(() => el.files.length === 1, 'the file');

  expect(await el.checkValidity()).toBe(true);
});

/* The consumer's message wins over the uploader's own complaint. */
test('a consumer error beats a rejection', async () => {
  const el = await mount('max-files="1" error="Upload failed on the server."');

  drop(el, [file('a.pdf'), file('b.pdf')]);
  await frame();
  await frame();

  expect(errorText(el)).toBe('Upload failed on the server.');
  expect(await el.getValidationMessage()).toBe('Upload failed on the server.');
});

/* A rejection is a real constraint failure, not only a message. */
test('a rejection makes the control invalid', async () => {
  const el = await mount('name="docs" max-files="1"', (html) => `<form>${html}</form>`);

  drop(el, [file('a.pdf'), file('b.pdf')]);
  await until(() => Boolean(errorText(el)), 'the rejection');

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('You can upload up to 1 file.');
});

/*
 * A reset restores what the control started with, not an empty list — the
 * rule a native `<input value="initial">` follows.
 */
test('a reset restores the files it started with', async () => {
  const el = await mount('name="docs"', (html) => `<form>${html}<button>reset</button></form>`);
  const form = document.querySelector('form') as HTMLFormElement;

  el.files = [file('initial.pdf')];
  await until(() => el.files.length === 1, 'the initial file');
  drop(el, [file('added.pdf')]);
  await until(() => el.files.length === 2, 'the added file');

  form.reset();
  await until(() => el.files.length === 0, 'the reset');
});

test('a reset clears a rejection too', async () => {
  const el = await mount('name="docs" max-files="1"', (html) => `<form>${html}</form>`);
  const form = document.querySelector('form') as HTMLFormElement;

  drop(el, [file('a.pdf'), file('b.pdf')]);
  await until(() => Boolean(errorText(el)), 'the rejection');

  form.reset();
  await until(() => !errorText(el), 'the rejection to clear');
  expect(await el.checkValidity()).toBe(true);
});

/* The picker is opened by the dropzone, and by a consumer calling `open()`. */
test('clicking the dropzone opens the picker', async () => {
  const el = await mount();
  let opened = 0;
  input(el).addEventListener('click', (event) => {
    event.preventDefault();
    opened += 1;
  });

  await userEvent.click(part(el, 'dropzone'));
  await (el as unknown as { open(): Promise<void> }).open();

  expect(opened).toBe(2);
});
