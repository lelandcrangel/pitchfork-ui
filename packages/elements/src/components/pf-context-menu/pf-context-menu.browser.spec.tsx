/**
 * pf-context-menu is tested in a real browser, all of it.
 *
 * The `contextmenu` event is dispatched synthetically here on purpose: it is
 * this element's own listener, so a trusted event is not required — unlike
 * light-dismiss, which goes through `userEvent`.
 */
import { userEvent } from '@vitest/browser/context';
import { expect, test } from 'vitest';
import './pf-context-menu';
import '../pf-menu-item/pf-menu-item';
import '../pf-menu-separator/pf-menu-separator';

type ContextMenu = HTMLElement & {
  open: boolean;
  disabled: boolean;
  showAt(x: number, y: number): Promise<void>;
  hide(): Promise<void>;
};

const FIXTURE = (attrs = '') => `
  <pf-context-menu ${attrs}>
    <div id="region" style="width:300px;height:200px">Right-click me</div>
    <div slot="menu">
      <pf-menu-item value="copy">Copy</pf-menu-item>
      <pf-menu-item value="paste" disabled>Paste</pf-menu-item>
      <pf-menu-separator></pf-menu-separator>
      <pf-menu-item value="delete" destructive>Delete</pf-menu-item>
    </div>
  </pf-context-menu>
  <button type="button" id="elsewhere">Elsewhere</button>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-context-menu');
  await customElements.whenDefined('pf-menu-item');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-context-menu') as ContextMenu;
};

const until = async (predicate: () => boolean, label = 'pf-context-menu') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const panel = (el: ContextMenu) => el.shadowRoot?.querySelector('[part="menu"]') as HTMLElement;
const isOpen = (el: ContextMenu) => panel(el).matches(':popover-open');
const items = (el: ContextMenu) => Array.from(el.querySelectorAll('pf-menu-item')) as HTMLElement[];
const focusedValue = () => (document.activeElement as HTMLElement | null)?.getAttribute('value');
const press = (key: string) =>
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }),
  );

const rightClick = (el: ContextMenu, x = 50, y = 60) => {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    composed: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  (el.querySelector('#region') as HTMLElement).dispatchEvent(event);
  return event;
};

test('the panel is a named menu, closed to begin with', async () => {
  const el = await mount(FIXTURE('label="File actions"'));

  expect(panel(el).getAttribute('role')).toBe('menu');
  expect(panel(el).getAttribute('aria-label')).toBe('File actions');
  expect(isOpen(el)).toBe(false);
});

test('a right-click opens it and suppresses the native menu', async () => {
  const el = await mount(FIXTURE());

  const event = rightClick(el);
  await until(() => isOpen(el));

  expect(event.defaultPrevented).toBe(true);
});

/* Disabled means the browser's own context menu gets through untouched. */
test('a disabled menu lets the native one through', async () => {
  const el = await mount(FIXTURE('disabled'));

  const event = rightClick(el);
  await new Promise((resolve) => setTimeout(resolve, 120));

  expect(event.defaultPrevented).toBe(false);
  expect(isOpen(el)).toBe(false);
});

test('opens at the pointer', async () => {
  const el = await mount(FIXTURE());

  rightClick(el, 120, 90);
  await until(() => isOpen(el) && panel(el).style.left !== '');

  const box = panel(el).getBoundingClientRect();
  expect(Math.round(box.left)).toBe(120);
  expect(Math.round(box.top)).toBe(90);
});

/*
 * Pinned to the viewport padding rather than flipped above the cursor: the
 * pointer is already where the user is looking.
 */
test('pulls itself back inside the viewport near an edge', async () => {
  const el = await mount(FIXTURE());

  rightClick(el, window.innerWidth - 4, window.innerHeight - 4);
  await until(() => isOpen(el) && panel(el).style.left !== '');

  const box = panel(el).getBoundingClientRect();
  expect(box.right).toBeLessThanOrEqual(window.innerWidth - 8 + 1);
  expect(box.bottom).toBeLessThanOrEqual(window.innerHeight - 8 + 1);
  expect(box.left).toBeGreaterThanOrEqual(8 - 1);
});

/* A second right-click moves the open menu rather than being ignored. */
test('a second right-click relocates an already-open menu', async () => {
  const el = await mount(FIXTURE());

  rightClick(el, 40, 40);
  await until(() => isOpen(el) && panel(el).style.left === '40px');

  rightClick(el, 150, 100);
  await until(() => panel(el).style.left === '150px');

  expect(isOpen(el)).toBe(true);
});

test('focuses the first enabled item on open', async () => {
  const el = await mount(FIXTURE());

  rightClick(el);
  await until(() => focusedValue() === 'copy');
});

test('the arrows move between items and skip the disabled one', async () => {
  const el = await mount(FIXTURE());
  rightClick(el);
  await until(() => focusedValue() === 'copy');

  press('ArrowDown');
  await until(() => focusedValue() === 'delete');
  press('ArrowDown');
  await until(() => focusedValue() === 'copy');
});

test('clicking an item reports it and closes the menu', async () => {
  const el = await mount(FIXTURE());
  const seen: string[] = [];
  el.addEventListener('pfSelect', (e) =>
    seen.push((e as CustomEvent<{ value: string }>).detail.value),
  );

  rightClick(el);
  await until(() => isOpen(el));
  await userEvent.click(items(el)[0]);
  await until(() => !isOpen(el));

  expect(seen).toEqual(['copy']);
});

test('Escape closes it', async () => {
  const el = await mount(FIXTURE());
  rightClick(el);
  await until(() => focusedValue() === 'copy');

  press('Escape');
  await until(() => !isOpen(el));
});

test('a real outside click dismisses it', async () => {
  const el = await mount(FIXTURE());
  await el.showAt(40, 40);
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('elsewhere') as HTMLElement);
  await until(() => !isOpen(el), 'the context menu to light-dismiss');
  expect(el.open).toBe(false);
});

test('showAt() opens it from script at a given point', async () => {
  const el = await mount(FIXTURE());

  await el.showAt(70, 80);
  await until(() => isOpen(el) && panel(el).style.left === '70px');
});

test('reports each state change once through pfOpenChange', async () => {
  const el = await mount(FIXTURE());
  const seen: boolean[] = [];
  el.addEventListener('pfOpenChange', (e) =>
    seen.push((e as CustomEvent<{ open: boolean }>).detail.open),
  );

  rightClick(el);
  await until(() => isOpen(el));
  await el.hide();
  await until(() => !isOpen(el));

  expect(seen).toEqual([true, false]);
});

/* A right-click on the open menu is the menu's own, not a reopen. */
test('a right-click inside the menu does not relocate it', async () => {
  const el = await mount(FIXTURE());
  rightClick(el, 40, 40);
  await until(() => isOpen(el) && panel(el).style.left === '40px');

  panel(el).dispatchEvent(
    new MouseEvent('contextmenu', {
      bubbles: true,
      composed: true,
      cancelable: true,
      clientX: 200,
      clientY: 200,
    }),
  );
  await new Promise((resolve) => setTimeout(resolve, 120));

  expect(panel(el).style.left).toBe('40px');
});
