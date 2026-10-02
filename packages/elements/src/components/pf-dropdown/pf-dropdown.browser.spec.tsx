/**
 * pf-dropdown is tested in a real browser, all of it: a `popover` panel, real
 * anchoring rects, real focus for the menu keyboard pattern, and
 * light-dismiss, which needs trusted input.
 */
import { userEvent } from '@vitest/browser/context';
import { expect, test } from 'vitest';
import './pf-dropdown';
import '../pf-menu-item/pf-menu-item';
import '../pf-menu-separator/pf-menu-separator';

type Dropdown = HTMLElement & {
  open: boolean;
  disabled: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
};

const FIXTURE = (attrs = '') => `
  <div style="padding:100px">
    <pf-dropdown ${attrs}>
      <button type="button">Actions</button>
      <div slot="menu">
        <pf-menu-item value="edit">Edit</pf-menu-item>
        <pf-menu-item value="dupe" disabled>Duplicate</pf-menu-item>
        <pf-menu-separator></pf-menu-separator>
        <pf-menu-item value="delete" destructive>Delete</pf-menu-item>
      </div>
    </pf-dropdown>
  </div>
  <button type="button" id="elsewhere">Elsewhere</button>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-dropdown');
  await customElements.whenDefined('pf-menu-item');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-dropdown') as Dropdown;
};

const until = async (predicate: () => boolean, label = 'pf-dropdown') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const panel = (el: Dropdown) => el.shadowRoot?.querySelector('[part="menu"]') as HTMLElement;
const isOpen = (el: Dropdown) => panel(el).matches(':popover-open');
const trigger = (el: Dropdown) => el.firstElementChild as HTMLElement;
const items = (el: Dropdown) => Array.from(el.querySelectorAll('pf-menu-item')) as HTMLElement[];
const focusedValue = () => (document.activeElement as HTMLElement | null)?.getAttribute('value');
const press = (key: string) =>
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }),
  );

test('the panel is a named menu, closed to begin with', async () => {
  const el = await mount(FIXTURE('label="Row actions"'));

  expect(panel(el).getAttribute('role')).toBe('menu');
  expect(panel(el).getAttribute('aria-label')).toBe('Row actions');
  expect(isOpen(el)).toBe(false);
});

test('the items are menuitems, with the disabled one marked', async () => {
  const el = await mount(FIXTURE());
  const list = items(el);

  expect(list.map((i) => i.getAttribute('role'))).toEqual(['menuitem', 'menuitem', 'menuitem']);
  expect(list[1].getAttribute('aria-disabled')).toBe('true');
  expect(list[0].hasAttribute('aria-disabled')).toBe(false);
  expect(el.querySelector('pf-menu-separator')?.getAttribute('role')).toBe('separator');
});

test('marks the trigger as a menu button, without a dangling aria-controls', async () => {
  const el = await mount(FIXTURE());

  expect(trigger(el).getAttribute('aria-haspopup')).toBe('menu');
  expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  expect(trigger(el).hasAttribute('aria-controls')).toBe(false);
});

test('the trigger toggles it and aria-expanded follows', async () => {
  const el = await mount(FIXTURE());

  await userEvent.click(trigger(el));
  await until(() => isOpen(el));
  expect(trigger(el).getAttribute('aria-expanded')).toBe('true');

  await userEvent.click(trigger(el));
  await until(() => !isOpen(el));
  expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
});

/* The ARIA menu pattern puts focus on the first item, not on the panel. */
test('focuses the first enabled item on open', async () => {
  const el = await mount(FIXTURE());

  await el.show();
  await until(() => isOpen(el) && focusedValue() === 'edit');
});

test('ArrowDown on the closed trigger opens it, as a menu button should', async () => {
  const el = await mount(FIXTURE());
  trigger(el).focus();

  press('ArrowDown');
  await until(() => isOpen(el));
});

test('the arrows move between items and skip the disabled one', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => focusedValue() === 'edit');

  press('ArrowDown');
  await until(() => focusedValue() === 'delete');

  // Wraps, as a menu does.
  press('ArrowDown');
  await until(() => focusedValue() === 'edit');

  press('ArrowUp');
  await until(() => focusedValue() === 'delete');
});

test('Home and End jump to the ends', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => focusedValue() === 'edit');

  press('End');
  await until(() => focusedValue() === 'delete');
  press('Home');
  await until(() => focusedValue() === 'edit');
});

test('clicking an item reports it and closes the menu', async () => {
  const el = await mount(FIXTURE());
  const seen: string[] = [];
  el.addEventListener('pfSelect', (e) =>
    seen.push((e as CustomEvent<{ value: string }>).detail.value),
  );

  await el.show();
  await until(() => isOpen(el));
  await userEvent.click(items(el)[0]);
  await until(() => !isOpen(el));

  expect(seen).toEqual(['edit']);
});

test('Enter on a focused item selects it', async () => {
  const el = await mount(FIXTURE());
  const seen: string[] = [];
  el.addEventListener('pfSelect', (e) =>
    seen.push((e as CustomEvent<{ value: string }>).detail.value),
  );

  await el.show();
  await until(() => focusedValue() === 'edit');
  press('Enter');
  await until(() => seen.length > 0);

  expect(seen).toEqual(['edit']);
});

/* A disabled item swallows the click rather than reporting a selection. */
test('a disabled item cannot be selected', async () => {
  const el = await mount(FIXTURE());
  const seen: string[] = [];
  el.addEventListener('pfSelect', (e) =>
    seen.push((e as CustomEvent<{ value: string }>).detail.value),
  );

  await el.show();
  await until(() => isOpen(el));
  /*
   * A plain click, not userEvent: Playwright refuses to click an element it
   * reads as disabled and times out instead. The handler under test is this
   * element's own, which does not need a trusted event — unlike light-dismiss.
   */
  items(el)[1].click();
  await new Promise((resolve) => setTimeout(resolve, 120));

  expect(seen).toEqual([]);
  expect(isOpen(el)).toBe(true);
});

/* The child event is the menu's business, not the consumer's. */
test('does not leak pfMenuSelect out of the dropdown', async () => {
  const el = await mount(FIXTURE());
  const leaked: unknown[] = [];
  document.body.addEventListener('pfMenuSelect', (e) => leaked.push(e));

  await el.show();
  await until(() => isOpen(el));
  await userEvent.click(items(el)[0]);
  await until(() => !isOpen(el));

  expect(leaked).toEqual([]);
});

test('returns focus to the trigger after a selection', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(items(el)[0]);
  await until(() => document.activeElement === trigger(el));
});

test('Escape closes it and returns focus to the trigger', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => focusedValue() === 'edit');

  press('Escape');
  await until(() => !isOpen(el));
  expect(document.activeElement).toBe(trigger(el));
});

/* The browser's light-dismiss, which is why the panel is `auto`. */
test('a real outside click dismisses it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('elsewhere') as HTMLElement);
  await until(() => !isOpen(el), 'the dropdown to light-dismiss');
  expect(el.open).toBe(false);
});

test('a disabled dropdown does not open', async () => {
  const el = await mount(FIXTURE('disabled'));

  await userEvent.click(trigger(el));
  await new Promise((resolve) => setTimeout(resolve, 120));
  expect(isOpen(el)).toBe(false);

  await el.show();
  await new Promise((resolve) => setTimeout(resolve, 120));
  expect(isOpen(el)).toBe(false);
});

test('reports each state change once through pfOpenChange', async () => {
  const el = await mount(FIXTURE());
  const seen: boolean[] = [];
  el.addEventListener('pfOpenChange', (e) =>
    seen.push((e as CustomEvent<{ open: boolean }>).detail.open),
  );

  await userEvent.click(trigger(el));
  await until(() => isOpen(el));
  await userEvent.click(trigger(el));
  await until(() => !isOpen(el));

  expect(seen).toEqual([true, false]);
});

test('anchors below the trigger when there is room', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => isOpen(el) && panel(el).style.top !== '');

  const anchor = trigger(el).getBoundingClientRect();
  expect(panel(el).getBoundingClientRect().top).toBeGreaterThanOrEqual(anchor.bottom);
});

/*
 * The shared item reads a generic `--pf-menu-*` set that each container
 * defines, which is what lets one element serve both menus. That cannot be
 * asserted here: this project applies no `styleUrl` CSS, so the
 * `:host { --pf-menu-text: ... }` rule never runs. `scripts/smoke-consumer.mjs`
 * checks it against a real build instead.
 */
test('leaves the shared item unstyled here, which is the project’s limit not a bug', async () => {
  const el = await mount(FIXTURE());

  expect(getComputedStyle(items(el)[0]).getPropertyValue('--pf-menu-text').trim()).toBe('');
  expect(el.shadowRoot?.adoptedStyleSheets).toHaveLength(0);
});
