/**
 * Real focus and `slotchange`, neither of which the fast project has. Every
 * button being an ordinary tab stop is the thing worth measuring here: a group
 * of toggle buttons is not a roving-tabindex pattern, unlike the tab strip or
 * the toolbar next door.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-button-group';
import '../pf-button-group-item/pf-button-group-item';
import '../pf-icon/pf-icon';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const FIXTURE = (attrs = '') => `
  <pf-button-group ${attrs}>
    <pf-button-group-item value="day">Day</pf-button-group-item>
    <pf-button-group-item value="week">Week</pf-button-group-item>
    <pf-button-group-item value="month">Month</pf-button-group-item>
  </pf-button-group>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-button-group');
  await customElements.whenDefined('pf-button-group-item');
  await frame();
  await frame();
  return document.querySelector('pf-button-group') as HTMLElement & {
    value: string;
    refresh(): Promise<void>;
  };
};

const until = async (predicate: () => boolean, label = 'pf-button-group') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const item = (el: HTMLElement, value: string) =>
  el.querySelector(`pf-button-group-item[value="${value}"]`) as HTMLElement;
const button = (host: Element) =>
  host.shadowRoot?.querySelector('[part="button"]') as HTMLButtonElement;
const focusedValue = () => (document.activeElement as HTMLElement)?.getAttribute('value') ?? null;

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * Three buttons, three tab stops — and `activeElement` reports the item host,
 * because the button it holds is inside that item's shadow root.
 */
test('every enabled button is a tab stop', async () => {
  document.body.innerHTML = `<button id="before">before</button>${FIXTURE()}`;
  await customElements.whenDefined('pf-button-group-item');
  await frame();
  await frame();

  (document.getElementById('before') as HTMLButtonElement).focus();
  for (const value of ['day', 'week', 'month']) {
    await userEvent.keyboard('{Tab}');
    expect(focusedValue()).toBe(value);
  }
});

test('Enter and Space on a button choose it', async () => {
  const el = await mount(FIXTURE());

  button(item(el, 'week')).focus();
  await userEvent.keyboard('{Enter}');
  await until(() => el.value === 'week', 'Enter');

  button(item(el, 'month')).focus();
  await userEvent.keyboard(' ');
  await until(() => el.value === 'month', 'Space');
});

/* A disabled button is skipped by the browser, not by any code here. */
test('a disabled button is neither focusable nor clickable', async () => {
  const el = await mount(`
    <pf-button-group>
      <pf-button-group-item value="day">Day</pf-button-group-item>
      <pf-button-group-item value="week" disabled>Week</pf-button-group-item>
    </pf-button-group>`);

  button(item(el, 'day')).focus();
  await userEvent.keyboard('{Tab}');
  expect(focusedValue()).not.toBe('week');

  // Dispatched rather than clicked: Playwright refuses a disabled element, and
  // the point is that the element itself swallows it.
  button(item(el, 'week')).click();
  await frame();
  await frame();
  expect(el.value).toBe('');
});

test('counts a button appended after mount', async () => {
  const el = await mount(FIXTURE('value="year"'));
  expect(el.querySelectorAll('pf-button-group-item[selected]')).toHaveLength(0);

  const added = document.createElement('pf-button-group-item');
  added.setAttribute('value', 'year');
  added.textContent = 'Year';
  el.append(added);

  await until(() => added.hasAttribute('selected'), 'the added button being pressed');
});

/*
 * The group's disabled state and the button's own are separate props, so
 * enabling the group leaves a button the consumer disabled alone.
 */
test('enabling the group leaves a separately disabled button disabled', async () => {
  const el = await mount(`
    <pf-button-group disabled>
      <pf-button-group-item value="day">Day</pf-button-group-item>
      <pf-button-group-item value="week" disabled>Week</pf-button-group-item>
    </pf-button-group>`);
  await until(() => button(item(el, 'day')).disabled, 'the group disabling');

  el.removeAttribute('disabled');
  await until(() => !button(item(el, 'day')).disabled, 'the group enabling');
  expect(button(item(el, 'week')).disabled).toBe(true);
});
