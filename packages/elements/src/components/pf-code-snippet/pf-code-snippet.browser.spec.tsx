/**
 * The clipboard, which needs a real `navigator`, and `slotchange`, which the
 * mock DOM never fires.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test, vi } from 'vitest';
import './pf-code-snippet';

type Snippet = HTMLElement & {
  code: string;
  copy(): Promise<boolean>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-code-snippet');
  await frame();
  await frame();
  return document.querySelector('pf-code-snippet') as Snippet;
};

const until = async (predicate: () => boolean, label = 'pf-code-snippet') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Snippet, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;
const status = (el: Snippet) => el.shadowRoot!.getElementById('status') as HTMLElement;

const withClipboard = (clipboard: unknown) => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  return () => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  };
};

let restore: (() => void) | undefined;

afterEach(() => {
  restore?.();
  restore = undefined;
  document.body.innerHTML = '';
});

test('the button copies the code and says so', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  restore = withClipboard({ writeText });

  const el = await mount('<pf-code-snippet code="const a = 1;"></pf-code-snippet>');
  const copied: string[] = [];
  el.addEventListener('pfCopy', (event) =>
    copied.push((event as CustomEvent<{ code: string }>).detail.code),
  );

  await userEvent.click(part(el, 'copy'));

  await until(() => part(el, 'copy').textContent?.includes('Copied') ?? false, 'the label');
  expect(writeText).toHaveBeenCalledWith('const a = 1;');
  expect(copied).toEqual(['const a = 1;']);
  expect(status(el).textContent).toBe('Copied');
});

/*
 * The branch the React component got wrong: with no clipboard API its `if`
 * was false, nothing was copied, and the button said "Copied". The claim and
 * the report both have to follow what actually happened.
 */
test('it says the copy failed when there is no clipboard', async () => {
  restore = withClipboard(undefined);

  const el = await mount('<pf-code-snippet code="const a = 1;"></pf-code-snippet>');
  const copied: string[] = [];
  const failed: string[] = [];
  el.addEventListener('pfCopy', (event) =>
    copied.push((event as CustomEvent<{ code: string }>).detail.code),
  );
  el.addEventListener('pfCopyError', (event) =>
    failed.push((event as CustomEvent<{ message: string }>).detail.message),
  );

  expect(await el.copy()).toBe(false);
  await until(() => status(el).textContent === 'Copy failed', 'the announcement');

  expect(part(el, 'copy').textContent).toContain('Copy failed');
  expect(copied).toEqual([]);
  expect(failed).toEqual(['Copy failed']);
});

test('it says the copy failed when the write is refused', async () => {
  restore = withClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });

  const el = await mount('<pf-code-snippet code="x"></pf-code-snippet>');
  expect(await el.copy()).toBe(false);
  await until(() => status(el).textContent === 'Copy failed', 'the announcement');
});

/*
 * The announcement goes back to nothing, so the next copy is a change the
 * live region reports rather than the same text it already holds.
 *
 * Real timers, with a short `feedback-duration`. Fake ones are not an option:
 * `vi.useFakeTimers()` replaces `requestAnimationFrame`, which Stencil's
 * render queue runs on, so every poll after it hangs to the 15s timeout —
 * measured, four tests at once.
 */
test('the announcement clears itself', async () => {
  restore = withClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });

  const el = await mount('<pf-code-snippet code="x" feedback-duration="40"></pf-code-snippet>');
  await el.copy();

  await until(() => status(el).textContent === 'Copied', 'the announcement');
  await until(() => status(el).textContent === '', 'the announcement to clear');
  expect(part(el, 'copy').textContent).toContain('Copy');
});

/* One timer, restarted rather than stacked. */
test('a second copy restarts the timer rather than stacking one', async () => {
  restore = withClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });

  const el = await mount('<pf-code-snippet code="x" feedback-duration="120"></pf-code-snippet>');
  await el.copy();
  await until(() => status(el).textContent === 'Copied', 'the first announcement');
  await new Promise((resolve) => setTimeout(resolve, 80));

  await el.copy();
  // The first timer would have fired by now had it not been cleared.
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(status(el).textContent).toBe('Copied');

  await until(() => status(el).textContent === '', 'the announcement to clear');
});

/* Slotted markup is the consumer's highlighter's, and its text is what copies. */
test('it copies the slotted markup’s own text when there is no code', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  restore = withClipboard({ writeText });

  const el = await mount(
    '<pf-code-snippet><span class="tok">const</span><span> a = 1;</span></pf-code-snippet>',
  );

  await el.copy();
  expect(writeText).toHaveBeenCalledWith('const a = 1;');
});

/*
 * `slotchange`, which the mock DOM never fires: markup slotted after mount
 * replaces the plain text, which is why the slot stays in the tree while the
 * box around it is hidden.
 */
test('markup slotted later takes over from the plain text', async () => {
  const el = await mount('<pf-code-snippet code="const a = 1;"></pf-code-snippet>');
  const markup = () => el.shadowRoot!.querySelector('.markup') as HTMLElement;

  expect(markup().className).toContain('empty');
  expect(el.shadowRoot!.querySelector('.plain')).toBeTruthy();

  const highlighted = document.createElement('span');
  highlighted.textContent = 'const a = 1;';
  el.appendChild(highlighted);

  await until(() => !markup().className.includes('empty'), 'the slotted markup');
  expect(el.shadowRoot!.querySelector('.plain')).toBeNull();
});

/* A numbered line keeps the author's indentation, which `pre` is for. */
test('a numbered line preserves its leading whitespace', async () => {
  const el = await mount(
    '<pf-code-snippet show-line-numbers code="if (a) {\n  return 1;\n}"></pf-code-snippet>',
  );
  const contents = Array.from(el.shadowRoot!.querySelectorAll('.line-content')).map(
    (node) => node.textContent,
  );

  expect(contents).toEqual(['if (a) {', '  return 1;', '}']);
  expect(
    getComputedStyle(el.shadowRoot!.querySelector('.line-content') as HTMLElement).whiteSpace,
  ).not.toBe('normal');
});
