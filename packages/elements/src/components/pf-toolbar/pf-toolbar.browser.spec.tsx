/**
 * The half of pf-toolbar that only a real browser can exercise.
 *
 * Two reasons, both measured rather than assumed:
 *
 * - **Stencil's mock DOM does not support `:not(:disabled)`.** Probed
 *   directly: `button:not(:disabled)` matches 2 of 2 buttons when one is
 *   disabled, and `button.disabled` reads `undefined` there. So any assertion
 *   about disabled items being skipped is meaningless in the `unit` project.
 *   (Core's own roving tests do cover it — they run on jsdom, which honours
 *   the selector.)
 * - **Arrow-key navigation needs real focus.** It reads
 *   `document.activeElement` and calls `.focus()`, which the mock DOM does not
 *   model.
 */
import { expect, test } from 'vitest';
import './pf-toolbar';
import '../pf-toolbar-separator/pf-toolbar-separator';

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.body.firstElementChild as HTMLElement;
  await customElements.whenDefined('pf-toolbar');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
};

const buttons = (root: HTMLElement) => Array.from(root.querySelectorAll('button'));
const tabIndexes = (root: HTMLElement) => buttons(root).map((button) => button.tabIndex);
const focusedText = () => (document.activeElement as HTMLElement | null)?.textContent;

const press = (key: string) => {
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }),
  );
};

test('leaves exactly one real tab stop', async () => {
  const root = await mount(
    `<pf-toolbar><button>a</button><button>b</button><button>c</button></pf-toolbar>`,
  );

  expect(tabIndexes(root)).toEqual([0, -1, -1]);
});

test('skips a disabled control when choosing the tab stop', async () => {
  const root = await mount(
    `<pf-toolbar><button disabled>a</button><button>b</button><button>c</button></pf-toolbar>`,
  );

  // The disabled button is not an item at all, so it keeps the -1 the UA gives
  // it and the first *enabled* button becomes the stop.
  expect(buttons(root)[1].tabIndex).toBe(0);
  expect(buttons(root)[2].tabIndex).toBe(-1);
});

test('moves along the horizontal axis and wraps at both ends', async () => {
  const root = await mount(
    `<pf-toolbar><button>a</button><button>b</button><button>c</button></pf-toolbar>`,
  );
  buttons(root)[0].focus();
  expect(focusedText()).toBe('a');

  press('ArrowRight');
  expect(focusedText()).toBe('b');
  press('ArrowRight');
  expect(focusedText()).toBe('c');
  press('ArrowRight');
  expect(focusedText()).toBe('a');
  press('ArrowLeft');
  expect(focusedText()).toBe('c');
});

test('jumps to the ends on Home and End', async () => {
  const root = await mount(
    `<pf-toolbar><button>a</button><button>b</button><button>c</button></pf-toolbar>`,
  );
  buttons(root)[1].focus();

  press('End');
  expect(focusedText()).toBe('c');
  press('Home');
  expect(focusedText()).toBe('a');
});

/*
 * A horizontal toolbar must not claim Up/Down: those arrows scroll the page,
 * and in a vertical toolbar Left/Right must stay free to move a text caret.
 */
test('leaves the other axis to the browser', async () => {
  const root = await mount(`<pf-toolbar><button>a</button><button>b</button></pf-toolbar>`);
  buttons(root)[0].focus();

  press('ArrowDown');
  expect(focusedText()).toBe('a');
  press('ArrowUp');
  expect(focusedText()).toBe('a');
});

test('moves on Up and Down when vertical', async () => {
  const root = await mount(
    `<pf-toolbar orientation="vertical"><button>a</button><button>b</button></pf-toolbar>`,
  );
  buttons(root)[0].focus();

  press('ArrowDown');
  expect(focusedText()).toBe('b');
  press('ArrowRight');
  expect(focusedText()).toBe('b');
});

test('skips over a disabled control while navigating', async () => {
  const root = await mount(
    `<pf-toolbar><button>a</button><button disabled>b</button><button>c</button></pf-toolbar>`,
  );
  buttons(root)[0].focus();

  press('ArrowRight');
  expect(focusedText()).toBe('c');
});

test('a separator is not a stop on the way past', async () => {
  const root = await mount(
    `<pf-toolbar><button>a</button><pf-toolbar-separator></pf-toolbar-separator><button>b</button></pf-toolbar>`,
  );
  buttons(root)[0].focus();

  press('ArrowRight');
  expect(focusedText()).toBe('b');
});

/*
 * The tab stop follows whatever the user actually focused, so tabbing out and
 * back returns to where they were rather than to the first item.
 */
test('moves the tab stop to whatever gains focus', async () => {
  const root = await mount(
    `<pf-toolbar><button>a</button><button>b</button><button>c</button></pf-toolbar>`,
  );

  buttons(root)[2].focus();
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(tabIndexes(root)).toEqual([-1, -1, 0]);
});
