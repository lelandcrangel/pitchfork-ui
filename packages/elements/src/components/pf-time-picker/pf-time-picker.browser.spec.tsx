/**
 * Browser-tested in full, because it is form-associated: the mock DOM stubs
 * ElementInternals and jsdom has no `setFormValue`, so either one throws on
 * the first lifecycle call.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-time-picker';

type Picker = HTMLElement & {
  value: string;
  open: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-time-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-time-picker') as Picker;
};

const until = async (predicate: () => boolean, label = 'pf-time-picker') => {
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
const isOpen = (el: Picker) => panel(el).matches(':popover-open');
const columns = (el: Picker) =>
  Array.from(el.shadowRoot?.querySelectorAll('[part="column"]') ?? []) as HTMLElement[];
const columnNamed = (el: Picker, name: string) =>
  columns(el).find((column) => column.getAttribute('aria-label') === name)!;
const optionIn = (el: Picker, column: string, label: string) =>
  Array.from(columnNamed(el, column).querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === label,
  ) as HTMLButtonElement | undefined;
const selectedIn = (el: Picker, column: string) =>
  columnNamed(el, column).querySelector('[data-selected="true"]')?.textContent?.trim() ?? null;

afterEach(() => {
  document.body.innerHTML = '';
});

test('shows the placeholder until it has a time', async () => {
  const el = await mount('<pf-time-picker placeholder="Pick a time"></pf-time-picker>');
  expect(trigger(el).textContent).toContain('Pick a time');
  expect(isOpen(el)).toBe(false);
});

test('shows a 24-hour value as given', async () => {
  const el = await mount('<pf-time-picker value="14:30"></pf-time-picker>');
  expect(trigger(el).textContent).toContain('14:30');
});

/* The display changes with the cycle; the value never does. */
test('shows a 12-hour value with a meridiem, keeping the value canonical', async () => {
  const el = await mount('<pf-time-picker value="14:30" hour-cycle="12"></pf-time-picker>');
  expect(trigger(el).textContent).toContain('2:30 PM');
  expect(el.value).toBe('14:30');
});

test('offers two columns on a 24-hour cycle and three on a 12-hour one', async () => {
  const day = await mount('<pf-time-picker value="14:30"></pf-time-picker>');
  expect(columns(day).map((c) => c.getAttribute('aria-label'))).toEqual(['Hour', 'Minute']);

  const half = await mount('<pf-time-picker value="14:30" hour-cycle="12"></pf-time-picker>');
  expect(columns(half).map((c) => c.getAttribute('aria-label'))).toEqual([
    'Hour',
    'Minute',
    'AM or PM',
  ]);
});

test('offers 24 hours and 60 minutes by default', async () => {
  const el = await mount('<pf-time-picker></pf-time-picker>');
  expect(columnNamed(el, 'Hour').querySelectorAll('button')).toHaveLength(24);
  expect(columnNamed(el, 'Minute').querySelectorAll('button')).toHaveLength(60);
});

test('honours minute-step', async () => {
  const el = await mount('<pf-time-picker minute-step="15"></pf-time-picker>');
  const labels = Array.from(columnNamed(el, 'Minute').querySelectorAll('button')).map((b) =>
    b.textContent?.trim(),
  );
  expect(labels).toEqual(['00', '15', '30', '45']);
});

test('marks the chosen hour and minute in their columns', async () => {
  const el = await mount('<pf-time-picker value="14:30"></pf-time-picker>');

  expect(selectedIn(el, 'Hour')).toBe('14');
  expect(selectedIn(el, 'Minute')).toBe('30');
});

/* On a 12-hour cycle the hour column shows the face, not the 24-hour hour. */
test('marks the clock face on a 12-hour cycle', async () => {
  const el = await mount('<pf-time-picker value="14:30" hour-cycle="12"></pf-time-picker>');

  expect(selectedIn(el, 'Hour')).toBe('02');
  expect(selectedIn(el, 'AM or PM')).toBe('PM');
});

test('the trigger opens and closes the panel', async () => {
  const el = await mount('<pf-time-picker value="14:30"></pf-time-picker>');

  trigger(el).click();
  await until(() => isOpen(el));
  await until(() => trigger(el).getAttribute('aria-expanded') === 'true');

  trigger(el).click();
  await until(() => !isOpen(el), 'the second click to close it');
});

test('points the trigger at the panel with an IDREF that resolves', async () => {
  const el = await mount('<pf-time-picker></pf-time-picker>');

  const id = trigger(el).getAttribute('aria-controls');
  expect(id).toBe('panel');
  expect(el.shadowRoot?.getElementById(id!)).toBe(panel(el));
});

test('choosing an hour keeps the minute, and reports once', async () => {
  const el = await mount('<pf-time-picker value="14:30"></pf-time-picker>');
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await el.show();
  await until(() => isOpen(el));
  optionIn(el, 'Hour', '09')!.click();

  await until(() => el.value === '09:30', 'the hour to change');
  expect(changes).toEqual(['09:30']);
});

test('choosing a minute keeps the hour', async () => {
  const el = await mount('<pf-time-picker value="14:30"></pf-time-picker>');

  await el.show();
  await until(() => isOpen(el));
  optionIn(el, 'Minute', '45')!.click();

  await until(() => el.value === '14:45', 'the minute to change');
});

/*
 * The conversion core owns: a 12-hour face plus a meridiem back to 24 hours,
 * including the two cases `hour % 12` gets wrong.
 */
test('converts a 12-hour choice to a canonical 24-hour value', async () => {
  const el = await mount('<pf-time-picker value="14:30" hour-cycle="12"></pf-time-picker>');

  await el.show();
  await until(() => isOpen(el));

  // 9 PM, since the meridiem is already PM.
  optionIn(el, 'Hour', '09')!.click();
  await until(() => el.value === '21:30', '9 with PM to become 21:30');

  optionIn(el, 'AM or PM', 'AM')!.click();
  await until(() => el.value === '09:30', 'AM to bring it back to the morning');
});

test('maps the 12 face onto midnight and midday', async () => {
  const el = await mount('<pf-time-picker value="09:00" hour-cycle="12"></pf-time-picker>');

  await el.show();
  await until(() => isOpen(el));

  optionIn(el, 'Hour', '12')!.click();
  await until(() => el.value === '00:00', '12 AM to be midnight');

  optionIn(el, 'AM or PM', 'PM')!.click();
  await until(() => el.value === '12:00', '12 PM to be midday');
});

/* With nothing chosen, picking a minute assumes midnight rather than nothing. */
test('picking only a minute produces a complete time', async () => {
  const el = await mount('<pf-time-picker></pf-time-picker>');

  await el.show();
  await until(() => isOpen(el));
  optionIn(el, 'Minute', '30')!.click();

  await until(() => el.value === '00:30', 'a minute alone to complete the time');
});

test('ignores a value that is not a time', async () => {
  const el = await mount('<pf-time-picker value="25:99"></pf-time-picker>');

  expect(trigger(el).textContent).toContain('Select time');
  expect(selectedIn(el, 'Hour')).toBeNull();
});

test('the arrows move within a column and stop at its ends', async () => {
  const el = await mount('<pf-time-picker value="00:00"></pf-time-picker>');
  await el.show();
  await until(() => isOpen(el));

  const column = columnNamed(el, 'Hour');
  const focused = () => el.shadowRoot?.activeElement?.textContent?.trim();
  await until(() => focused() === '00', 'focus to start on the chosen hour');

  column.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  await until(() => focused() === '01');

  // At the top, Up stays put rather than wrapping to 23.
  column.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await until(() => focused() === '00');
  column.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(focused()).toBe('00');
});

test('a real Escape closes it and gives focus back', async () => {
  const el = await mount('<pf-time-picker value="14:30"></pf-time-picker>');

  await el.show();
  await until(() => isOpen(el));

  await userEvent.keyboard('{Escape}');
  await until(() => !isOpen(el), 'Escape to close it');
  await until(() => el.shadowRoot?.activeElement === trigger(el), 'focus to return');
});

test('a real outside click closes it', async () => {
  document.body.innerHTML = `
    <button type="button" id="elsewhere">Elsewhere</button>
    <pf-time-picker value="14:30"></pf-time-picker>`;
  await customElements.whenDefined('pf-time-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-time-picker') as Picker;

  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('elsewhere')!);
  await until(() => !isOpen(el), 'the outside click to close it');
});

test('a disabled picker does not open', async () => {
  const el = await mount('<pf-time-picker value="14:30" disabled></pf-time-picker>');

  trigger(el).click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(isOpen(el)).toBe(false);
});

// ─── Form association ────────────────────────────────────────────────────────

test('submits its canonical value under its name', async () => {
  document.body.innerHTML = `
    <form id="f"><pf-time-picker name="at" value="14:30"></pf-time-picker></form>`;
  await customElements.whenDefined('pf-time-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['at', '14:30']]);
});

/* 24-hour even when displayed as 12-hour, which is the whole point. */
test('submits 24-hour even on a 12-hour cycle', async () => {
  document.body.innerHTML = `
    <form id="f">
      <pf-time-picker name="at" value="14:30" hour-cycle="12"></pf-time-picker>
    </form>`;
  await customElements.whenDefined('pf-time-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['at', '14:30']]);
});

test('reflects name, so a property-setting binding still submits', async () => {
  document.body.innerHTML = `<form id="f"><pf-time-picker value="14:30"></pf-time-picker></form>`;
  await customElements.whenDefined('pf-time-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const el = document.querySelector('pf-time-picker') as Picker & { name: string };
  el.name = 'at';
  await until(() => el.getAttribute('name') === 'at', 'name to reflect');

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['at', '14:30']]);
});

test('is absent from the submission when it has no time', async () => {
  document.body.innerHTML = `<form id="f"><pf-time-picker name="at"></pf-time-picker></form>`;
  await customElements.whenDefined('pf-time-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([]);
});

test('a form reset restores the value it started with', async () => {
  document.body.innerHTML = `
    <form id="f"><pf-time-picker name="at" value="14:30"></pf-time-picker></form>`;
  await customElements.whenDefined('pf-time-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-time-picker') as Picker;

  el.value = '09:00';
  await until(() => el.value === '09:00');

  (document.getElementById('f') as HTMLFormElement).reset();
  await until(() => el.value === '14:30', 'the reset to restore the initial value');
});

test('a required picker with no time is invalid, and says why', async () => {
  const el = await mount('<pf-time-picker name="at" required></pf-time-picker>');

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = '14:30';
  await until(() => el.value === '14:30');
  expect(await el.checkValidity()).toBe(true);
});

test('an error message wins over the required message', async () => {
  const el = await mount(
    '<pf-time-picker name="at" required error="Office hours only"></pf-time-picker>',
  );

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('Office hours only');
});

test('labels the trigger, so clicking the label opens the field', async () => {
  const el = await mount('<pf-time-picker label="Start time"></pf-time-picker>');

  expect((part(el, 'label') as HTMLLabelElement).htmlFor).toBe('trigger');
  expect(trigger(el).id).toBe('trigger');
});
