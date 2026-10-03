/**
 * Browser-tested in full, because it is form-associated — and because the one
 * claim worth making about its submission (two entries from one control) only
 * works against a real `ElementInternals`.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-date-range-picker';

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
  await customElements.whenDefined('pf-date-range-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-date-range-picker') as Picker;
};

const until = async (predicate: () => boolean, label = 'pf-date-range-picker') => {
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
const day = (el: Picker, iso: string) =>
  el.shadowRoot?.querySelector(`button[data-day="${iso}"]`) as HTMLButtonElement | null;
const classesOf = (el: Picker, iso: string) => Array.from(day(el, iso)?.classList ?? []);
const insideDays = (el: Picker) =>
  Array.from(el.shadowRoot?.querySelectorAll('.day--inside') ?? []).map((d) =>
    d.getAttribute('data-day'),
  );

afterEach(() => {
  document.body.innerHTML = '';
});

test('shows the placeholder until it has a range', async () => {
  const el = await mount('<pf-date-range-picker placeholder="Pick dates"></pf-date-range-picker>');
  expect(trigger(el).textContent).toContain('Pick dates');
});

test('shows both ends once it has a range', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  expect(trigger(el).textContent).toContain('Mar 10, 2024');
  expect(trigger(el).textContent).toContain('Mar 20, 2024');
});

/* Two months, because a range usually spans one boundary. */
test('shows two consecutive months', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  const labels = Array.from(el.shadowRoot?.querySelectorAll('[part="grid"]') ?? []).map((g) =>
    g.getAttribute('aria-label'),
  );
  expect(labels).toEqual(['March 2024', 'April 2024']);
});

test('marks the two ends and the days between', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-14"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  expect(classesOf(el, '2024-03-10')).toContain('day--start');
  expect(classesOf(el, '2024-03-14')).toContain('day--end');
  expect(insideDays(el)).toEqual(['2024-03-11', '2024-03-12', '2024-03-13']);
});

/* Strictly inside, so an endpoint is never also drawn as the middle. */
test('never marks an endpoint as inside', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-14"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  expect(classesOf(el, '2024-03-10')).not.toContain('day--inside');
  expect(classesOf(el, '2024-03-14')).not.toContain('day--inside');
});

test('two clicks make a range, and report it once', async () => {
  // Mounted with a range so the grids open on a known month; the first click
  // then replaces it.
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  const changes: Array<{ value: string; start: string; end: string }> = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string; start: string; end: string }>).detail);
  });

  await el.show();
  await until(() => isOpen(el));

  day(el, '2024-03-05')!.click();
  await until(() => el.value === '', 'the first click to clear the old range');
  expect(changes).toHaveLength(0);

  day(el, '2024-03-08')!.click();
  await until(() => el.value === '2024-03-05/2024-03-08', 'the second click to close it');
  expect(changes).toEqual([
    { value: '2024-03-05/2024-03-08', start: '2024-03-05', end: '2024-03-08' },
  ]);
  await until(() => !isOpen(el), 'the panel to close');
});

/*
 * A half-made range is not a range, so `value` stays empty until both ends
 * exist — a form read mid-selection would otherwise see a start with no end.
 */
test('holds a half-made range out of the value', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  day(el, '2024-03-05')!.click();
  await until(() => el.value === '');

  // The start is still drawn, though.
  await until(() => classesOf(el, '2024-03-05').includes('day--start'));
});

test('swaps the ends when the second click is earlier', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  day(el, '2024-03-18')!.click();
  await until(() => el.value === '');
  day(el, '2024-03-12')!.click();

  await until(() => el.value === '2024-03-12/2024-03-18', 'the ends to swap');
});

test('clicking the same day twice starts over rather than making a one-day range', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  day(el, '2024-03-15')!.click();
  await until(() => el.value === '');
  day(el, '2024-03-15')!.click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(el.value).toBe('');
  expect(isOpen(el)).toBe(true);
});

/* The preview that follows the pointer while the range is half-made. */
test('previews a range from the hovered day', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  day(el, '2024-03-05')!.click();
  await until(() => el.value === '');

  day(el, '2024-03-09')!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  /*
   * Waited on the expected content, not on `length > 0`: the previous range's
   * highlight is still on screen for a frame or two, so a length check passes
   * against stale DOM and the assertion then reads it.
   */
  await until(
    () => insideDays(el).join(',') === '2024-03-06,2024-03-07,2024-03-08',
    'the preview to follow the hover',
  );
  expect(insideDays(el)).toEqual(['2024-03-06', '2024-03-07', '2024-03-08']);
  expect(classesOf(el, '2024-03-09')).toContain('day--end');
});

test('previews nothing before the first click', async () => {
  const el = await mount('<pf-date-range-picker></pf-date-range-picker>');
  await el.show();
  await until(() => isOpen(el));

  const cells = Array.from(el.shadowRoot?.querySelectorAll('button[data-day]') ?? []);
  cells[10]?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
  await new Promise((resolve) => setTimeout(resolve, 60));

  expect(insideDays(el)).toEqual([]);
});

test('the arrows move one tab stop across both months', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  const stops = () =>
    Array.from(el.shadowRoot?.querySelectorAll('button[data-day][tabindex="0"]') ?? []).map((b) =>
      b.getAttribute('data-day'),
    );
  await until(() => stops().length === 1, 'a single tab stop');
  expect(stops()).toEqual(['2024-03-10']);

  panel(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await until(() => stops()[0] === '2024-03-11');

  panel(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
  await until(() => stops()[0] === '2024-04-11', 'the tab stop to cross into April');
  // April is the right-hand month, so the grids did not have to move.
  const labels = Array.from(el.shadowRoot?.querySelectorAll('[part="grid"]') ?? []).map((g) =>
    g.getAttribute('aria-label'),
  );
  expect(labels).toEqual(['March 2024', 'April 2024']);
});

test('Enter picks the focused day', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  panel(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await until(() => el.value === '', 'Enter to start a new range');

  panel(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  panel(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await until(() => el.value === '2024-03-10/2024-03-11', 'Enter to close the range');
});

test('refuses a day outside min/max', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20" min="2024-03-05" max="2024-03-25"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  expect(day(el, '2024-03-01')?.getAttribute('aria-disabled')).toBe('true');
  day(el, '2024-03-01')!.click();
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(el.value).toBe('2024-03-10/2024-03-20');
});

test('clears the range when asked', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20" allow-clear></pf-date-range-picker>',
  );
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  (part(el, 'clear') as HTMLButtonElement).click();
  await until(() => el.value === '', 'the clear button');
  expect(changes).toEqual(['']);
});

test('a real Escape closes it and gives focus back', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-10/2024-03-20"></pf-date-range-picker>',
  );

  await el.show();
  await until(() => isOpen(el));

  await userEvent.keyboard('{Escape}');
  await until(() => !isOpen(el), 'Escape to close it');
  await until(() => el.shadowRoot?.activeElement === trigger(el), 'focus to return');
});

test('ignores a value that is not a complete range', async () => {
  for (const value of ['2024-03-10', '2024-03-10/', 'nonsense']) {
    const el = await mount(`<pf-date-range-picker value="${value}"></pf-date-range-picker>`);
    expect(trigger(el).textContent).toContain('Select dates');
  }
});

test('orders the ends of a value given backwards', async () => {
  const el = await mount(
    '<pf-date-range-picker value="2024-03-20/2024-03-10"></pf-date-range-picker>',
  );
  await el.show();
  await until(() => isOpen(el));

  expect(classesOf(el, '2024-03-10')).toContain('day--start');
  expect(classesOf(el, '2024-03-20')).toContain('day--end');
});

// ─── Form association ────────────────────────────────────────────────────────

/*
 * The measurement this element is built on: `setFormValue` accepts a
 * `FormData`, and every entry in it is submitted — so one control submits both
 * ends. The element's own `name` attribute is ignored in that mode, also
 * measured, which is why the two keys are built from the property.
 */
test('submits two entries from one control', async () => {
  document.body.innerHTML = `
    <form id="f">
      <pf-date-range-picker name="trip" value="2024-03-10/2024-03-20"></pf-date-range-picker>
    </form>`;
  await customElements.whenDefined('pf-date-range-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([
    ['trip-start', '2024-03-10'],
    ['trip-end', '2024-03-20'],
  ]);
});

test('is absent from the submission without a complete range', async () => {
  document.body.innerHTML = `
    <form id="f"><pf-date-range-picker name="trip"></pf-date-range-picker></form>`;
  await customElements.whenDefined('pf-date-range-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([]);
});

test('a form reset restores the range it started with', async () => {
  document.body.innerHTML = `
    <form id="f">
      <pf-date-range-picker name="trip" value="2024-03-10/2024-03-20"></pf-date-range-picker>
    </form>`;
  await customElements.whenDefined('pf-date-range-picker');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-date-range-picker') as Picker;

  el.value = '2024-06-01/2024-06-10';
  await until(() => el.value === '2024-06-01/2024-06-10');

  (document.getElementById('f') as HTMLFormElement).reset();
  await until(() => el.value === '2024-03-10/2024-03-20', 'the reset to restore the range');
});

test('a required picker with no range is invalid, and says why', async () => {
  const el = await mount('<pf-date-range-picker name="trip" required></pf-date-range-picker>');

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = '2024-03-10/2024-03-20';
  await until(() => el.value === '2024-03-10/2024-03-20');
  expect(await el.checkValidity()).toBe(true);
});

test('an error message wins over the required message', async () => {
  const el = await mount(
    '<pf-date-range-picker name="trip" required error="Pick at least two nights"></pf-date-range-picker>',
  );

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('Pick at least two nights');
});

test('labels the trigger', async () => {
  const el = await mount('<pf-date-range-picker label="Stay"></pf-date-range-picker>');

  expect((part(el, 'label') as HTMLLabelElement).htmlFor).toBe('trigger');
  expect(trigger(el).id).toBe('trigger');
});
