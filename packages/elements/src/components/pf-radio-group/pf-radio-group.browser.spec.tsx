/**
 * The radio pair is tested in a real browser, all of it.
 *
 * Three reasons, all measured: the group is form-associated, so
 * ElementInternals must be real; the keyboard pattern reads
 * `document.activeElement` and calls `.focus()`; and the mock DOM ignores
 * `:not(:disabled)` and reads `input.checked` as `undefined`.
 */
import { expect, test } from 'vitest';
import './pf-radio-group';
import '../pf-radio-button/pf-radio-button';

type Group = HTMLElement & {
  value: string;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};
type Radio = HTMLElement & { value: string; checked: boolean };

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-radio-group');
  await customElements.whenDefined('pf-radio-button');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.body.firstElementChild as Group;
};

const until = async (predicate: () => boolean) => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for pf-radio-group');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const GROUP = (extra = '', radios = '') => `
  <pf-radio-group name="plan" legend="Plan" ${extra}>
    <pf-radio-button value="free">Free</pf-radio-button>
    <pf-radio-button value="pro">Pro</pf-radio-button>
    <pf-radio-button value="team" ${radios}>Team</pf-radio-button>
  </pf-radio-group>`;

const radios = (group: Group) => Array.from(group.querySelectorAll('pf-radio-button')) as Radio[];
const native = (radio: Radio) => radio.shadowRoot?.querySelector('input') as HTMLInputElement;
const checkedValues = (group: Group) =>
  radios(group)
    .filter((r) => r.checked)
    .map((r) => r.value);
const nativeChecked = (group: Group) =>
  radios(group)
    .filter((r) => native(r).checked)
    .map((r) => r.value);
const tabStops = (group: Group) =>
  radios(group)
    .filter((r) => r.tabIndex === 0)
    .map((r) => r.value);
const press = (key: string) =>
  document.activeElement?.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true }),
  );

test('announces itself as a radiogroup, labelled by its legend', async () => {
  const group = await mount(GROUP());

  expect(group.getAttribute('role')).toBe('radiogroup');
  expect(group.getAttribute('aria-labelledby')).toBe('legend');
  expect(group.shadowRoot?.querySelector('[part="legend"]')?.id).toBe('legend');
});

test('the children are radios the browser draws', async () => {
  const group = await mount(GROUP());

  for (const radio of radios(group)) {
    expect(native(radio).type).toBe('radio');
    // Never an independent tab stop: the group drives tab order via the host.
    expect(native(radio).tabIndex).toBe(-1);
  }
});

/*
 * The invariant the group exists for. Three independent form-associated
 * elements with one name all stay checked and all submit — measured against a
 * hand-rolled one before this was written.
 */
test('exactly one choice is ever checked', async () => {
  const group = await mount(GROUP('value="pro"'));
  expect(checkedValues(group)).toEqual(['pro']);
  expect(nativeChecked(group)).toEqual(['pro']);

  native(radios(group)[2]).click();
  // Wait for the rendered dots, not for the group's value: the children
  // re-render several frames after the group accepts.
  await until(() => nativeChecked(group).join() === 'team');

  expect(checkedValues(group)).toEqual(['team']);
});

test('reports the new selection once, through pfChange', async () => {
  const group = await mount(GROUP('value="free"'));
  const seen: string[] = [];
  group.addEventListener('pfChange', (e) =>
    seen.push((e as CustomEvent<{ value: string }>).detail.value),
  );

  native(radios(group)[1]).click();
  await until(() => group.value === 'pro');

  expect(seen).toEqual(['pro']);
});

/* The child's own event is the group's business, not the consumer's. */
test('does not leak the child pfRadioSelect event out of the group', async () => {
  const group = await mount(GROUP());
  const leaked: unknown[] = [];
  document.body.addEventListener('pfRadioSelect', (e) => leaked.push(e));

  native(radios(group)[1]).click();
  await until(() => group.value === 'pro');

  expect(leaked).toEqual([]);
});

/*
 * The ARIA pattern puts the single tab stop on the selected choice, so tabbing
 * in lands on the current answer rather than at the top of the list.
 */
test('is one tab stop, on the selected choice', async () => {
  const group = await mount(GROUP('value="pro"'));

  expect(tabStops(group)).toEqual(['pro']);
});

test('falls back to the first enabled choice when nothing is selected', async () => {
  const group = await mount(GROUP());

  expect(tabStops(group)).toEqual(['free']);
});

test('never makes a disabled choice the tab stop', async () => {
  const group = await mount(`
    <pf-radio-group name="plan">
      <pf-radio-button value="free" disabled>Free</pf-radio-button>
      <pf-radio-button value="pro">Pro</pf-radio-button>
    </pf-radio-group>`);

  expect(tabStops(group)).toEqual(['pro']);
  expect(radios(group)[0].tabIndex).toBe(-1);
});

/* Focus delegation: the host is activeElement, the ring lands on the input. */
test('focusing a choice reaches the native radio inside it', async () => {
  const group = await mount(GROUP('value="free"'));
  const first = radios(group)[0];

  first.focus();

  expect(document.activeElement).toBe(first);
  expect(first.shadowRoot?.activeElement).toBe(native(first));
  expect(native(first).matches(':focus-visible')).toBe(true);
});

/* In a radiogroup the arrows move *and* select — unlike a toolbar. */
test('the arrows move the selection, not just the focus', async () => {
  const group = await mount(GROUP('value="free"'));
  radios(group)[0].focus();

  press('ArrowDown');
  await until(() => group.value === 'pro');
  expect(document.activeElement).toBe(radios(group)[1]);

  press('ArrowDown');
  await until(() => group.value === 'team');

  // Wraps at the end, as a native radio group does.
  press('ArrowDown');
  await until(() => group.value === 'free');

  press('ArrowUp');
  await until(() => group.value === 'team');
});

test('the arrows skip a disabled choice entirely', async () => {
  const group = await mount(`
    <pf-radio-group name="plan" value="free">
      <pf-radio-button value="free">Free</pf-radio-button>
      <pf-radio-button value="pro" disabled>Pro</pf-radio-button>
      <pf-radio-button value="team">Team</pf-radio-button>
    </pf-radio-group>`);
  radios(group)[0].focus();

  press('ArrowDown');
  await until(() => group.value === 'team');
});

test('Home and End jump to the ends', async () => {
  const group = await mount(GROUP('value="pro"'));
  radios(group)[1].focus();

  press('End');
  await until(() => group.value === 'team');
  press('Home');
  await until(() => group.value === 'free');
});

test('a horizontal group moves on Left and Right instead', async () => {
  const group = await mount(GROUP('value="free" orientation="horizontal"'));
  radios(group)[0].focus();

  press('ArrowDown');
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(group.value).toBe('free');

  press('ArrowRight');
  await until(() => group.value === 'pro');
});

test('its value reaches the surrounding form', async () => {
  document.body.innerHTML = `<form>${GROUP('value="pro"')}</form>`;
  await customElements.whenDefined('pf-radio-group');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect([...new FormData(document.querySelector('form') as HTMLFormElement).entries()]).toEqual([
    ['plan', 'pro'],
  ]);
});

/* Nothing selected is absent from the submission, as native radios are. */
test('an unanswered group is absent from the submission', async () => {
  document.body.innerHTML = `<form>${GROUP()}</form>`;
  await customElements.whenDefined('pf-radio-group');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect([...new FormData(document.querySelector('form') as HTMLFormElement).entries()]).toEqual(
    [],
  );
});

test('a required group is invalid until something is chosen', async () => {
  const group = await mount(GROUP('required'));

  expect(await group.checkValidity()).toBe(false);
  expect(await group.getValidationMessage()).toBe('This field is required.');

  native(radios(group)[0]).click();
  await until(() => group.value === 'free');

  expect(await group.checkValidity()).toBe(true);
});

test('an explicit error wins over the required message', async () => {
  const group = await mount(GROUP('required error="Pick a plan to continue."'));

  expect(await group.getValidationMessage()).toBe('Pick a plan to continue.');
  expect(group.getAttribute('aria-invalid')).toBe('true');
  expect(group.getAttribute('aria-describedby')).toBe('error');
});

/*
 * The native input checks itself the instant it is clicked, before the group
 * has any say — so declining has to put the dot back, not merely ignore it.
 */
test('a disabled group puts the dot back after a click', async () => {
  const group = await mount(GROUP('value="free" disabled'));

  native(radios(group)[1]).click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(group.value).toBe('free');
  expect(nativeChecked(group)).toEqual(['free']);
});

test('a disabled choice puts the dot back after a click', async () => {
  const group = await mount(GROUP('value="free"', 'disabled'));

  native(radios(group)[2]).click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(group.value).toBe('free');
  expect(nativeChecked(group)).toEqual(['free']);
});

test('restores its initial choice when the form resets', async () => {
  document.body.innerHTML = `<form>${GROUP('value="pro"')}</form>`;
  await customElements.whenDefined('pf-radio-group');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const form = document.querySelector('form') as HTMLFormElement;
  const group = document.querySelector('pf-radio-group') as Group;

  native(radios(group)[2]).click();
  await until(() => nativeChecked(group).join() === 'team');

  form.reset();
  await until(() => nativeChecked(group).join() === 'pro');

  expect(group.value).toBe('pro');
});

test('picks up a choice added after first render', async () => {
  const group = await mount(GROUP('value="enterprise"'));
  expect(checkedValues(group)).toEqual([]);

  const added = document.createElement('pf-radio-button') as Radio;
  added.value = 'enterprise';
  added.textContent = 'Enterprise';
  group.append(added);
  await until(() => added.checked === true);

  expect(checkedValues(group)).toEqual(['enterprise']);
});
