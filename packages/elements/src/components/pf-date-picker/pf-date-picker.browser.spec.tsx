/**
 * pf-date-picker is browser-tested in full: it is form-associated, so
 * Stencil's mock DOM (which stubs ElementInternals) and jsdom (which has
 * `attachInternals` but neither `setFormValue` nor `setValidity`) both throw
 * on its first lifecycle call.
 *
 * Light dismiss and Escape go through `userEvent`, because the browser only
 * does them for trusted input — measured.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-date-picker';
import '../pf-calendar/pf-calendar';

type Picker = HTMLElement & {
  value: string;
  open: boolean;
  isDateDisabled?: (date: Date) => boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-date-picker');
  await customElements.whenDefined('pf-calendar');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-date-picker') as Picker;
};

const until = async (predicate: () => boolean, label = 'pf-date-picker') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const part = (el: Picker, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const trigger = (el: Picker) => part(el, 'trigger') as HTMLButtonElement;
const panel = (el: Picker) => part(el, 'panel') as HTMLElement;
const calendar = (el: Picker) => el.shadowRoot?.querySelector('pf-calendar') as HTMLElement;
const dayIn = (el: Picker, iso: string) =>
  calendar(el).shadowRoot?.querySelector(`button[data-day="${iso}"]`) as HTMLButtonElement | null;
const isOpen = (el: Picker) => panel(el).matches(':popover-open');

afterEach(() => {
  document.body.innerHTML = '';
});

test('renders a closed trigger showing the placeholder', async () => {
  const el = await mount('<pf-date-picker placeholder="Pick one"></pf-date-picker>');

  expect(trigger(el).textContent).toContain('Pick one');
  expect(isOpen(el)).toBe(false);
  expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
});

test('shows a value in the trigger instead of the placeholder', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');
  expect(trigger(el).textContent).toContain('Mar 15, 2024');
});

/*
 * Same shadow root for the trigger and the panel, which is the one case where
 * an IDREF resolves — pf-dropdown cannot do this, because its trigger is
 * slotted light DOM.
 */
test('points the trigger at the panel with an IDREF that resolves', async () => {
  const el = await mount('<pf-date-picker></pf-date-picker>');

  const id = trigger(el).getAttribute('aria-controls');
  expect(id).toBe('panel');
  expect(el.shadowRoot?.getElementById(id!)).toBe(panel(el));
  expect(trigger(el).getAttribute('aria-haspopup')).toBe('dialog');
});

test('the trigger opens and closes the calendar', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');

  trigger(el).click();
  await until(() => isOpen(el));
  expect(el.open).toBe(true);
  await until(() => trigger(el).getAttribute('aria-expanded') === 'true');

  trigger(el).click();
  await until(() => !isOpen(el), 'the second click to close it');
});

test('ArrowDown opens it from the closed trigger', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');

  trigger(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await until(() => isOpen(el), 'ArrowDown to open it');
});

/* The calendar owns its tab stop and is asked for focus through a method. */
test('moves focus into the grid when it opens', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');

  await el.show();
  await until(() => isOpen(el));
  await until(
    () => calendar(el).shadowRoot?.activeElement?.getAttribute('data-day') === '2024-03-15',
    'focus to land on the selected day',
  );
});

test('choosing a day sets the value, closes, and returns focus to the trigger', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await el.show();
  await until(() => isOpen(el));
  dayIn(el, '2024-03-20')!.click();

  await until(() => !isOpen(el), 'the pick to close it');
  expect(el.value).toBe('2024-03-20');
  await until(() => trigger(el).textContent?.includes('Mar 20, 2024') === true);
  expect(el.shadowRoot?.activeElement).toBe(trigger(el));
});

/*
 * Exactly one, not two. The calendar's own pfChange is stopped and re-emitted
 * from this element, and telling the two apart needs `composedPath()[0]` —
 * `event.target` is retargeted to the host for both, so a guard written that
 * way swallows the calendar's event and the field never updates.
 */
test('reports exactly one change per pick', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await el.show();
  await until(() => isOpen(el));
  dayIn(el, '2024-03-20')!.click();
  await until(() => changes.length > 0);
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(changes).toEqual(['2024-03-20']);
});

test('a real Escape closes it and gives focus back', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');

  await el.show();
  await until(() => isOpen(el));

  await userEvent.keyboard('{Escape}');
  await until(() => !isOpen(el), 'Escape to close it');
  await until(() => el.shadowRoot?.activeElement === trigger(el), 'focus to return');
});

/* popover="auto" does light dismiss itself, for trusted input only. */
test('a real outside click closes it', async () => {
  document.body.innerHTML = `
    <button type="button" id="elsewhere">Elsewhere</button>
    <pf-date-picker value="2024-03-15"></pf-date-picker>`;
  await customElements.whenDefined('pf-date-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-date-picker') as Picker;

  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('elsewhere')!);
  await until(() => !isOpen(el), 'the outside click to close it');
});

test('forwards min and max to the calendar', async () => {
  const el = await mount(
    '<pf-date-picker value="2024-03-15" min="2024-03-10" max="2024-03-20"></pf-date-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  expect(dayIn(el, '2024-03-05')?.getAttribute('aria-disabled')).toBe('true');
  expect(dayIn(el, '2024-03-15')?.getAttribute('aria-disabled')).toBeNull();
});

test('forwards the isDateDisabled predicate', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');
  el.isDateDisabled = (date: Date) => date.getDate() === 20;
  await el.show();
  await until(() => isOpen(el));
  await until(() => dayIn(el, '2024-03-20')?.getAttribute('aria-disabled') === 'true');

  dayIn(el, '2024-03-20')!.click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(el.value).toBe('2024-03-15');
  expect(isOpen(el)).toBe(true);
});

test('clears the value when asked, and only then', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15" allow-clear></pf-date-picker>');
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  (part(el, 'clear') as HTMLButtonElement).click();
  await until(() => el.value === '', 'the clear button');
  expect(changes).toEqual(['']);
  await until(() => part(el, 'clear') === null, 'the clear button to go once empty');
});

test('offers no clear button without allow-clear', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15"></pf-date-picker>');
  expect(part(el, 'clear')).toBeNull();
});

test('a disabled picker does not open', async () => {
  const el = await mount('<pf-date-picker value="2024-03-15" disabled></pf-date-picker>');

  trigger(el).click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(isOpen(el)).toBe(false);

  await el.show();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(isOpen(el)).toBe(false);
});

// ─── Form association ────────────────────────────────────────────────────────

test('submits its value under its name, as YYYY-MM-DD', async () => {
  document.body.innerHTML = `
    <form id="f"><pf-date-picker name="due" value="2024-03-15"></pf-date-picker></form>`;
  await customElements.whenDefined('pf-date-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['due', '2024-03-15']]);
});

/*
 * The submission name comes from the content attribute, so `name` has to be
 * reflected — the generated bindings set properties and would otherwise leave
 * the control nameless with every other sign of working.
 */
test('reflects name, so a property-setting binding still submits', async () => {
  document.body.innerHTML = `<form id="f"><pf-date-picker value="2024-03-15"></pf-date-picker></form>`;
  await customElements.whenDefined('pf-date-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const el = document.querySelector('pf-date-picker') as Picker & { name: string };
  el.name = 'due';
  await until(() => el.getAttribute('name') === 'due', 'name to reflect');

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['due', '2024-03-15']]);
});

/* Absent from the submission entirely when empty, not present-and-empty. */
test('is absent from the submission when it has no date', async () => {
  document.body.innerHTML = `<form id="f"><pf-date-picker name="due"></pf-date-picker></form>`;
  await customElements.whenDefined('pf-date-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([]);
});

test('a form reset restores the value it started with, not an empty one', async () => {
  document.body.innerHTML = `
    <form id="f"><pf-date-picker name="due" value="2024-03-15"></pf-date-picker></form>`;
  await customElements.whenDefined('pf-date-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-date-picker') as Picker;

  el.value = '2024-06-01';
  await until(() => el.value === '2024-06-01');

  (document.getElementById('f') as HTMLFormElement).reset();
  await until(() => el.value === '2024-03-15', 'the reset to restore the initial value');
});

test('a required picker with no date is invalid, and says why', async () => {
  const el = await mount('<pf-date-picker name="due" required></pf-date-picker>');

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = '2024-03-15';
  await until(() => el.value === '2024-03-15');
  expect(await el.checkValidity()).toBe(true);
});

/* error beats required, so a consumer's own message is not overwritten. */
test('an error message wins over the required message', async () => {
  const el = await mount(
    '<pf-date-picker name="due" required error="Pick a weekday"></pf-date-picker>',
  );

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('Pick a weekday');
});

test('marks the trigger invalid and wires the message to it', async () => {
  const el = await mount('<pf-date-picker error="Pick a weekday"></pf-date-picker>');

  expect(trigger(el).getAttribute('aria-invalid')).toBe('true');
  const describedBy = trigger(el).getAttribute('aria-describedby');
  expect(describedBy).toContain('error');
  expect(el.shadowRoot?.getElementById('error')?.textContent).toBe('Pick a weekday');
});

test('labels the trigger, so clicking the label opens the field', async () => {
  const el = await mount('<pf-date-picker label="Due date"></pf-date-picker>');

  const label = part(el, 'label') as HTMLLabelElement;
  expect(label.htmlFor).toBe('trigger');
  expect(trigger(el).id).toBe('trigger');
});
