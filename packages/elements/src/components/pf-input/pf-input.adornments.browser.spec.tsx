/**
 * The prefix and suffix slots, the clear button and the password reveal.
 */
import { afterEach, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import './pf-input';
import '../pf-icon/pf-icon';

type Input = HTMLElement & { value: string };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frame();
  }
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  const el = document.querySelector('pf-input') as Input;
  await until(() => el.classList.contains('hydrated'), 'hydration');
  await frame();
  return el;
};

const part = (el: Input, name: string) =>
  el.shadowRoot!.querySelector(`[part="${name}"]`) as HTMLElement | null;
const native = (el: Input) => el.shadowRoot!.querySelector('input') as HTMLInputElement;

afterEach(() => {
  document.body.innerHTML = '';
});

test('prefix and suffix sit inside the box, either side of the text', async () => {
  const el = await mount(`
    <pf-input label="Price" value="12">
      <span slot="prefix">£</span>
      <span slot="suffix">per month</span>
    </pf-input>`);

  const slots = [...part(el, 'control')!.querySelectorAll('slot')].map((slot) => slot.name);
  expect(slots).toEqual(['prefix', 'suffix']);
  const order = [...part(el, 'control')!.children].map((node) =>
    node.localName === 'slot' ? (node as HTMLSlotElement).name : node.localName,
  );
  expect(order).toEqual(['prefix', 'input', 'suffix']);
});

test('the clear button shows only while there is something to clear', async () => {
  const el = await mount('<pf-input label="Search" clearable></pf-input>');
  expect(part(el, 'clear')).toBeNull();

  el.value = 'shoes';
  await until(() => part(el, 'clear') !== null, 'the clear button');
  await expect
    .element(page.getByRole('button', { name: 'Clear', exact: true }))
    .toBeInTheDocument();
});

test('clearing empties the field as typing would, and keeps focus in it', async () => {
  const el = await mount('<pf-input label="Search" value="shoes" clearable></pf-input>');
  const heard: string[] = [];
  el.addEventListener('pfInput', (e) => heard.push(`input:${(e as CustomEvent).detail.value}`));
  el.addEventListener('pfChange', (e) => heard.push(`change:${(e as CustomEvent).detail.value}`));

  await userEvent.click(part(el, 'clear')!);
  await until(() => el.value === '', 'the value to clear');

  expect(heard).toEqual(['input:', 'change:']);
  expect(el.shadowRoot!.activeElement).toBe(native(el));
  await until(() => part(el, 'clear') === null, 'the button to go');
});

test('a disabled or read-only field offers no clear button', async () => {
  const disabled = await mount('<pf-input label="Search" value="x" clearable disabled></pf-input>');
  expect(part(disabled, 'clear')).toBeNull();
  const readonly = await mount('<pf-input label="Search" value="x" clearable readonly></pf-input>');
  expect(part(readonly, 'clear')).toBeNull();
});

/*
 * One name and a pressed state, rather than a name that swaps: the reader
 * learns "Show password" once and hears whether it is on.
 */
test('reveal shows the password as text, as a pressed toggle', async () => {
  const el = await mount(
    '<pf-input label="Password" type="password" value="hunter2" revealable></pf-input>',
  );
  expect(native(el).type).toBe('password');

  const toggle = page.getByRole('button', { name: 'Show password', exact: true });
  await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');

  await userEvent.click(part(el, 'reveal')!);
  await until(() => native(el).type === 'text', 'the text to show');
  await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(el.shadowRoot!.activeElement).toBe(native(el));

  await userEvent.click(part(el, 'reveal')!);
  await until(() => native(el).type === 'password', 'the text to hide again');
});

test('revealable does nothing on a field that is not a password', async () => {
  const el = await mount('<pf-input label="Name" revealable></pf-input>');
  expect(part(el, 'reveal')).toBeNull();
});
