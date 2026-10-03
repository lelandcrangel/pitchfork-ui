/**
 * The keyboard, which is the reason this element exists in this shape: the
 * React Calendar has none, and focus movement needs a real DOM.
 */
import { expect, test } from 'vitest';
import './pf-calendar';

type Calendar = HTMLElement & {
  value?: string;
  isDateDisabled?: (date: Date) => boolean;
  goToMonth(date: string | Date): Promise<void>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-calendar');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-calendar') as Calendar;
};

const until = async (predicate: () => boolean, label = 'pf-calendar') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const grid = (el: Calendar) => el.shadowRoot?.querySelector('[part="grid"]') as HTMLElement;
const dayFor = (el: Calendar, iso: string) =>
  el.shadowRoot?.querySelector(`button[data-day="${iso}"]`) as HTMLButtonElement | null;
const tabStop = (el: Calendar) =>
  el.shadowRoot?.querySelector('button[data-day][tabindex="0"]')?.getAttribute('data-day') ?? null;
const focusedDay = (el: Calendar) =>
  (el.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute('data-day') ?? null;

const press = async (el: Calendar, key: string) => {
  grid(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

test('moves a day with the left and right arrows', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  expect(tabStop(el)).toBe('2024-03-15');

  await press(el, 'ArrowRight');
  await until(() => tabStop(el) === '2024-03-16');

  await press(el, 'ArrowLeft');
  await until(() => tabStop(el) === '2024-03-15');
});

test('moves a week with the up and down arrows', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');

  await press(el, 'ArrowDown');
  await until(() => tabStop(el) === '2024-03-22');

  await press(el, 'ArrowUp');
  await press(el, 'ArrowUp');
  await until(() => tabStop(el) === '2024-03-08');
});

test('Home and End go to the ends of the focused week', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');

  await press(el, 'Home');
  await until(() => tabStop(el) === '2024-03-10');

  await press(el, 'End');
  await until(() => tabStop(el) === '2024-03-16');
});

test('PageUp and PageDown step a month', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');

  await press(el, 'PageDown');
  await until(() => tabStop(el) === '2024-04-15');

  await press(el, 'PageUp');
  await press(el, 'PageUp');
  await until(() => tabStop(el) === '2024-02-15');
});

/* The grid follows focus across a month boundary rather than trapping it. */
test('scrolls the grid when focus leaves the month', async () => {
  const el = await mount('<pf-calendar value="2024-03-31"></pf-calendar>');
  expect(grid(el).getAttribute('aria-label')).toContain('March 2024');

  await press(el, 'ArrowRight');
  await until(() => tabStop(el) === '2024-04-01');
  await until(() => grid(el).getAttribute('aria-label')?.includes('April 2024') === true);
});

/* One tab stop at all times, wherever focus has got to. */
test('keeps exactly one tab stop as focus moves', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');

  for (const key of ['ArrowRight', 'ArrowDown', 'End', 'PageDown', 'Home']) {
    await press(el, key);
    const stops = Array.from(
      el.shadowRoot?.querySelectorAll('button[data-day][tabindex="0"]') ?? [],
    );
    expect(stops).toHaveLength(1);
  }
});

/* The new tab stop takes DOM focus, or the keyboard would stop responding. */
test('moves real focus onto the day it moved to', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  dayFor(el, '2024-03-15')!.focus();
  expect(focusedDay(el)).toBe('2024-03-15');

  await press(el, 'ArrowRight');
  await until(() => focusedDay(el) === '2024-03-16', 'focus to follow the arrow');
});

test('Enter selects the focused day and reports it', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  const chosen: string[] = [];
  el.addEventListener('pfChange', (event) => {
    chosen.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await press(el, 'ArrowRight');
  await press(el, 'Enter');

  await until(() => chosen.length === 1, 'the selection to be reported');
  expect(chosen).toEqual(['2024-03-16']);
  expect(el.value).toBe('2024-03-16');
});

test('Space selects too', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  const chosen: string[] = [];
  el.addEventListener('pfChange', (event) => {
    chosen.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await press(el, 'ArrowDown');
  await press(el, ' ');
  await until(() => chosen.length === 1);
  expect(chosen).toEqual(['2024-03-22']);
});

test('a click selects and reports', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  const chosen: string[] = [];
  el.addEventListener('pfChange', (event) => {
    chosen.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  dayFor(el, '2024-03-20')!.click();
  await until(() => chosen.length === 1);
  expect(chosen).toEqual(['2024-03-20']);
  // Polled: the property is set when the event fires, but the attribute is
  // reflected on the next render, and Stencil's queue is async.
  await until(() => el.getAttribute('value') === '2024-03-20', 'value to reflect');
});

/*
 * Focus crosses a blocked stretch, activation does not. Skipping disabled days
 * would make a long one impossible to get past with the keyboard.
 */
test('focus crosses a disabled day but Enter refuses it', async () => {
  const el = await mount(
    '<pf-calendar value="2024-03-15" min="2024-03-10" max="2024-03-16"></pf-calendar>',
  );
  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });

  await press(el, 'ArrowRight');
  await press(el, 'ArrowRight');
  await until(() => tabStop(el) === '2024-03-17', 'focus to reach the blocked day');

  await press(el, 'Enter');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(reported).toBe(false);
  expect(el.value).toBe('2024-03-15');
});

test('a click on a disabled day does nothing', async () => {
  const el = await mount(
    '<pf-calendar value="2024-03-15" min="2024-03-10" max="2024-03-20"></pf-calendar>',
  );
  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });

  dayFor(el, '2024-03-25')!.click();
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(reported).toBe(false);
  expect(el.value).toBe('2024-03-15');
});

/* The function prop, which only a property can carry. */
test('honours an isDateDisabled predicate set as a property', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  el.isDateDisabled = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
  await el.goToMonth('2024-03-01');
  await until(() => dayFor(el, '2024-03-16')?.getAttribute('aria-disabled') === 'true');

  // 2024-03-16 is a Saturday, 2024-03-18 a Monday.
  expect(dayFor(el, '2024-03-16')?.getAttribute('aria-disabled')).toBe('true');
  expect(dayFor(el, '2024-03-18')?.getAttribute('aria-disabled')).toBeNull();

  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });
  dayFor(el, '2024-03-16')!.click();
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(reported).toBe(false);
});

test('the month arrows move the grid', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  const navs = el.shadowRoot?.querySelectorAll('.nav') as NodeListOf<HTMLButtonElement>;

  navs[1].click();
  await until(() => grid(el).getAttribute('aria-label')?.includes('April 2024') === true);

  navs[0].click();
  navs[0].click();
  await until(() => grid(el).getAttribute('aria-label')?.includes('February 2024') === true);
});

test('the year control jumps the grid', async () => {
  const el = await mount(
    '<pf-calendar value="2024-03-15" start-year="2020" end-year="2030"></pf-calendar>',
  );
  const year = el.shadowRoot?.querySelectorAll('select')[1] as HTMLSelectElement;

  year.value = '2027';
  year.dispatchEvent(new Event('change', { bubbles: true }));
  await until(() => grid(el).getAttribute('aria-label')?.includes('March 2027') === true);
});

/* The arrows stop at the ends of the year range rather than walking out. */
test('refuses to move focus outside the year range', async () => {
  const el = await mount(
    '<pf-calendar value="2020-01-01" start-year="2020" end-year="2020"></pf-calendar>',
  );

  await press(el, 'ArrowLeft');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(tabStop(el)).toBe('2020-01-01');
  expect(grid(el).getAttribute('aria-label')).toContain('January 2020');
});

test('follows a value set from outside', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');

  el.value = '2024-07-04';
  await until(() => grid(el).getAttribute('aria-label')?.includes('July 2024') === true);
  expect(tabStop(el)).toBe('2024-07-04');
  expect(dayFor(el, '2024-07-04')?.getAttribute('aria-selected')).toBe('true');
});

test('goToMonth moves the grid without selecting anything', async () => {
  const el = await mount('<pf-calendar value="2024-03-15"></pf-calendar>');
  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });

  await el.goToMonth('2025-11-20');
  await until(() => grid(el).getAttribute('aria-label')?.includes('November 2025') === true);
  expect(el.value).toBe('2024-03-15');
  expect(reported).toBe(false);
});

test('marks today, and keeps marking it when it is also selected', async () => {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;

  const el = await mount(`<pf-calendar value="${iso}"></pf-calendar>`);
  const cell = dayFor(el, iso)!;

  expect(cell.getAttribute('aria-current')).toBe('date');
  expect(cell.getAttribute('aria-selected')).toBe('true');
  expect(cell.getAttribute('part')).toContain('today');
  expect(cell.getAttribute('part')).toContain('selected');
});

/*
 * The invariant behind the grid's whole keyboard story, checked after every
 * way of moving the month rather than only after the arrows.
 *
 * The year picker broke it: it moved `displayMonth` and left `focusedDate` on
 * a day no longer rendered, so not one cell carried `tabindex="0"` and the
 * grid fell out of the tab order — perfectly usable with a mouse, and
 * unreachable without one. The earlier year test passed throughout, because
 * it only looked at the heading.
 */
test('always has exactly one tab stop, in the month on screen', async () => {
  const el = await mount(
    '<pf-calendar value="2024-03-15" start-year="2020" end-year="2030"></pf-calendar>',
  );

  const check = async (what: string) => {
    const stops = Array.from(
      el.shadowRoot?.querySelectorAll('button[data-day][tabindex="0"]') ?? [],
    );
    expect(stops, `after ${what}`).toHaveLength(1);

    // And it is a day of the month the heading names, not a leftover.
    const month = grid(el).getAttribute('aria-label') ?? '';
    const iso = stops[0].getAttribute('data-day')!;
    const named = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
      new Date(`${iso}T12:00:00`),
    );
    expect(month, `after ${what}`).toContain(named);
  };

  await check('mounting');

  const selects = el.shadowRoot?.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
  const navs = el.shadowRoot?.querySelectorAll('.nav') as NodeListOf<HTMLButtonElement>;

  selects[1].value = '2027';
  selects[1].dispatchEvent(new Event('change', { bubbles: true }));
  await until(() => grid(el).getAttribute('aria-label')?.includes('2027') === true);
  await check('changing the year');

  selects[0].value = '0';
  selects[0].dispatchEvent(new Event('change', { bubbles: true }));
  await until(() => grid(el).getAttribute('aria-label')?.includes('January') === true);
  await check('changing the month');

  navs[1].click();
  await until(() => grid(el).getAttribute('aria-label')?.includes('February') === true);
  await check('the next-month arrow');

  navs[0].click();
  await until(() => grid(el).getAttribute('aria-label')?.includes('January') === true);
  await check('the previous-month arrow');

  await press(el, 'PageDown');
  await check('PageDown');

  await el.goToMonth('2025-06-10');
  await until(() => grid(el).getAttribute('aria-label')?.includes('June 2025') === true);
  await check('goToMonth');
});

/*
 * Landing on a shorter month keeps the day where it can, rather than
 * overflowing: from the 31st of January, the month picker's February is the
 * 29th, not the 2nd of March.
 */
test('clamps the tab stop into a shorter month', async () => {
  const el = await mount(
    '<pf-calendar value="2024-01-31" start-year="2020" end-year="2030"></pf-calendar>',
  );
  expect(tabStop(el)).toBe('2024-01-31');

  const months = el.shadowRoot?.querySelectorAll('select')[0] as HTMLSelectElement;
  months.value = '1';
  months.dispatchEvent(new Event('change', { bubbles: true }));

  await until(() => grid(el).getAttribute('aria-label')?.includes('February 2024') === true);
  expect(tabStop(el)).toBe('2024-02-29');
});
