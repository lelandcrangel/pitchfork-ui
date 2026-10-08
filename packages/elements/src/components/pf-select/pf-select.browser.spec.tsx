/**
 * Browser-tested in full: form-associated, so neither the mock DOM (which
 * stubs ElementInternals) nor jsdom (no `setFormValue`) gets past its first
 * lifecycle call. Escape and light dismiss go through `userEvent`, because the
 * browser only does them for trusted input.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-select';
import '../pf-option/pf-option';

type Select = HTMLElement & {
  value: string;
  open: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
  refresh(): Promise<void>;
  checkValidity(): Promise<boolean>;
  getValidationMessage(): Promise<string>;
};

const FIXTURE = (attrs = '') => `
  <pf-select ${attrs}>
    <pf-option value="apple">Apple</pf-option>
    <pf-option value="apricot">Apricot</pf-option>
    <pf-option value="banana">Banana</pf-option>
    <pf-option value="blackberry" disabled>Blackberry</pf-option>
    <pf-option value="cherry">Cherry</pf-option>
  </pf-select>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-select');
  await customElements.whenDefined('pf-option');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-select') as Select;
};

const until = async (predicate: () => boolean, label = 'pf-select') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const part = (el: Select, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const trigger = (el: Select) => part(el, 'trigger') as HTMLButtonElement;
const listbox = (el: Select) => part(el, 'listbox') as HTMLElement;
const isOpen = (el: Select) => listbox(el).matches(':popover-open');
const option = (el: Select, value: string) =>
  el.querySelector(`pf-option[value="${value}"]`) as HTMLElement | null;
const activeValue = (el: Select) =>
  el.querySelector('pf-option[active]')?.getAttribute('value') ?? null;
const selectedValue = (el: Select) =>
  el.querySelector('pf-option[selected]')?.getAttribute('value') ?? null;

/*
 * `composed: true` is not optional here. The trigger is inside this element's
 * shadow root and the key handler is a `@Listen` on the host, so a
 * `bubbles: true` event alone never reaches it — bubbling stops at the shadow
 * boundary unless the event is composed. Real key events are composed, so
 * leaving it off tests nothing but the test's own plumbing: every keyboard
 * assertion here timed out until it was added.
 */
const press = async (el: Select, key: string) => {
  trigger(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('shows the placeholder until something is chosen', async () => {
  const el = await mount(FIXTURE('placeholder="Pick a fruit"'));

  expect(trigger(el).textContent).toContain('Pick a fruit');
  expect(isOpen(el)).toBe(false);
  expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
});

/* The label comes from the option's slotted text, not from a prop. */
test('shows the chosen option label', async () => {
  const el = await mount(FIXTURE('value="banana"'));

  expect(trigger(el).textContent).toContain('Banana');
  expect(selectedValue(el)).toBe('banana');
});

test('is a combobox over a listbox of options', async () => {
  const el = await mount(FIXTURE());

  expect(trigger(el).getAttribute('role')).toBe('combobox');
  expect(trigger(el).getAttribute('aria-haspopup')).toBe('listbox');
  expect(listbox(el).getAttribute('role')).toBe('listbox');
  expect(option(el, 'apple')?.getAttribute('role')).toBe('option');
});

/* Same shadow root for trigger and listbox, so this IDREF resolves. */
test('points the trigger at the listbox with an IDREF that resolves', async () => {
  const el = await mount(FIXTURE());

  const id = trigger(el).getAttribute('aria-controls');
  expect(id).toBe('listbox');
  expect(el.shadowRoot?.getElementById(id!)).toBe(listbox(el));
});

test('the trigger opens and closes the listbox', async () => {
  const el = await mount(FIXTURE());

  trigger(el).click();
  await until(() => isOpen(el));
  await until(() => trigger(el).getAttribute('aria-expanded') === 'true');

  trigger(el).click();
  await until(() => !isOpen(el), 'the second click to close it');
});

/* Opens on the chosen option, not at the top. */
test('opens with the chosen option active', async () => {
  const el = await mount(FIXTURE('value="cherry"'));

  await el.show();
  await until(() => isOpen(el));
  await until(() => activeValue(el) === 'cherry', 'the chosen option to be active');
});

test('opens on the first selectable option when nothing is chosen', async () => {
  const el = await mount(FIXTURE());

  await el.show();
  await until(() => activeValue(el) === 'apple');
});

test('a click on an option takes it and closes', async () => {
  const el = await mount(FIXTURE());
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await el.show();
  await until(() => isOpen(el));
  option(el, 'banana')!.click();

  await until(() => el.value === 'banana', 'the click to take the value');
  expect(changes).toEqual(['banana']);
  await until(() => !isOpen(el), 'the listbox to close');
  expect(el.shadowRoot?.activeElement).toBe(trigger(el));
});

test('a disabled option does nothing when clicked', async () => {
  const el = await mount(FIXTURE('value="apple"'));
  let reported = false;
  el.addEventListener('pfChange', () => {
    reported = true;
  });

  await el.show();
  await until(() => isOpen(el));
  option(el, 'blackberry')!.click();
  await new Promise((resolve) => setTimeout(resolve, 80));

  expect(reported).toBe(false);
  expect(el.value).toBe('apple');
  expect(isOpen(el)).toBe(true);
});

test('ArrowDown on a closed select opens it', async () => {
  const el = await mount(FIXTURE());

  await press(el, 'ArrowDown');
  await until(() => isOpen(el), 'ArrowDown to open it');
});

test('the arrows move the active option and skip a disabled one', async () => {
  const el = await mount(FIXTURE('value="banana"'));
  await el.show();
  await until(() => activeValue(el) === 'banana');

  // Blackberry is disabled, so Down goes straight to Cherry.
  await press(el, 'ArrowDown');
  await until(() => activeValue(el) === 'cherry');

  await press(el, 'ArrowUp');
  await until(() => activeValue(el) === 'banana');
});

test('Home and End go to the ends of the selectable options', async () => {
  const el = await mount(FIXTURE('value="banana"'));
  await el.show();
  await until(() => activeValue(el) === 'banana');

  await press(el, 'End');
  await until(() => activeValue(el) === 'cherry');

  await press(el, 'Home');
  await until(() => activeValue(el) === 'apple');
});

test('Enter takes the active option', async () => {
  const el = await mount(FIXTURE());
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await press(el, 'ArrowDown');
  await until(() => isOpen(el));
  await press(el, 'ArrowDown');
  await until(() => activeValue(el) === 'apricot');

  await press(el, 'Enter');
  await until(() => el.value === 'apricot', 'Enter to take the value');
  expect(changes).toEqual(['apricot']);
  await until(() => !isOpen(el));
});

test('Space takes it too', async () => {
  const el = await mount(FIXTURE());

  await press(el, ' ');
  await until(() => isOpen(el), 'Space to open it');
  await press(el, ' ');
  await until(() => el.value === 'apple', 'Space to take the active option');
});

// ─── Typeahead, which the React Select does not have ────────────────────────

test('a letter jumps to the next option starting with it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'b');
  await until(() => activeValue(el) === 'banana', 'b to jump to Banana');
});

/*
 * Two letters inside the timeout are one word, not two jumps. `bc` matches
 * nothing, so nothing moves — which is the point: an earlier version of this
 * test pressed `b` then `c` and expected Cherry, and it was the test that was
 * wrong, not the behaviour.
 */
test('consecutive letters form one word rather than two jumps', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'b');
  await until(() => activeValue(el) === 'banana');

  await press(el, 'c');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(activeValue(el)).toBe('banana');
});

test('more letters narrow rather than jump on', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'a');
  await press(el, 'p');
  await press(el, 'r');
  await until(() => activeValue(el) === 'apricot', 'apr to narrow to Apricot');
});

/*
 * Blackberry is disabled, so `b` finds only Banana and repeating it stays
 * there rather than landing somewhere the keyboard cannot act.
 */
test('typeahead never lands on a disabled option', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'b');
  await until(() => activeValue(el) === 'banana');

  await press(el, 'b');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(activeValue(el)).toBe('banana');
});

test('a repeated letter cycles through the matches', async () => {
  document.body.innerHTML = `
    <pf-select>
      <pf-option value="b1">Banana</pf-option>
      <pf-option value="b2">Blackberry</pf-option>
      <pf-option value="c1">Cherry</pf-option>
    </pf-select>`;
  await customElements.whenDefined('pf-select');
  await customElements.whenDefined('pf-option');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-select') as Select;

  await el.show();
  await until(() => activeValue(el) === 'b1');

  // Banana is already active, so the first `b` steps on to Blackberry.
  await press(el, 'b');
  await until(() => activeValue(el) === 'b2', 'the first b to step to Blackberry');

  await press(el, 'b');
  await until(() => activeValue(el) === 'b1', 'the next b to cycle back');
});

/*
 * Closed, typeahead *chooses* rather than highlighting — what a native
 * `<select>` does. A highlight behind a closed listbox is no feedback at all.
 */
test('typeahead on a closed select chooses the option outright', async () => {
  const el = await mount(FIXTURE());
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await press(el, 'c');
  await until(() => el.value === 'cherry', 'c to choose Cherry with the listbox shut');
  expect(changes).toEqual(['cherry']);
  expect(isOpen(el)).toBe(false);
});

test('the typeahead buffer expires, so a later letter starts a new word', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'b');
  await until(() => activeValue(el) === 'banana');

  // Longer than the 500ms timeout, so `c` is a fresh word rather than `bc`.
  await new Promise((resolve) => setTimeout(resolve, 650));
  await press(el, 'c');
  await until(() => activeValue(el) === 'cherry', 'c to start a new word');
});

test('a letter that matches nothing leaves the active option alone', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => activeValue(el) === 'apple');

  await press(el, 'z');
  await new Promise((resolve) => setTimeout(resolve, 60));
  expect(activeValue(el)).toBe('apple');
});

// ─── Dismissal, slots and state ─────────────────────────────────────────────

test('a real Escape closes it and gives focus back', async () => {
  const el = await mount(FIXTURE('value="banana"'));

  await el.show();
  await until(() => isOpen(el));

  await userEvent.keyboard('{Escape}');
  await until(() => !isOpen(el), 'Escape to close it');
  await until(() => el.shadowRoot?.activeElement === trigger(el), 'focus to return');
});

test('a real outside click closes it', async () => {
  document.body.innerHTML = `
    <button type="button" id="elsewhere">Elsewhere</button>
    ${FIXTURE()}`;
  await customElements.whenDefined('pf-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-select') as Select;

  await el.show();
  await until(() => isOpen(el));

  await userEvent.click(document.getElementById('elsewhere')!);
  await until(() => !isOpen(el), 'the outside click to close it');
});

test('a disabled select does not open', async () => {
  const el = await mount(FIXTURE('disabled'));

  trigger(el).click();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(isOpen(el)).toBe(false);

  await el.show();
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(isOpen(el)).toBe(false);
});

test('follows a value set from outside', async () => {
  const el = await mount(FIXTURE());

  el.value = 'cherry';
  await until(() => trigger(el).textContent?.includes('Cherry') === true, 'the trigger to follow');
  expect(selectedValue(el)).toBe('cherry');
});

/* slotchange, which the mock DOM never fires. */
test('picks up an option added while mounted', async () => {
  const el = await mount(FIXTURE());

  const added = document.createElement('pf-option');
  added.setAttribute('value', 'damson');
  added.textContent = 'Damson';
  el.appendChild(added);
  await customElements.whenDefined('pf-option');

  await el.show();
  await until(() => isOpen(el));
  await press(el, 'd');
  await until(() => activeValue(el) === 'damson', 'the new option to be reachable');
});

/*
 * The way the generated bindings set props: as properties, never attributes.
 * A fixture writes `value="apple"` into HTML and so creates an attribute the
 * bindings never would, which is how an unreflected prop hides.
 */
test('works with an option whose value was only ever set as a property', async () => {
  document.body.innerHTML = `<pf-select></pf-select>`;
  await customElements.whenDefined('pf-select');
  await customElements.whenDefined('pf-option');
  const el = document.querySelector('pf-select') as Select;

  const added = document.createElement('pf-option') as HTMLElement & { value: string };
  added.textContent = 'From a property';
  el.appendChild(added);
  added.value = 'from-property';

  await until(() => added.getAttribute('value') === 'from-property', 'value to reflect');

  const changes: string[] = [];
  el.addEventListener('pfChange', (event) => {
    changes.push((event as CustomEvent<{ value: string }>).detail.value);
  });

  await el.show();
  await until(() => isOpen(el));
  added.click();

  await until(() => changes.length === 1, 'the selection to be reported');
  expect(changes).toEqual(['from-property']);
  expect(el.value).toBe('from-property');
});

test('refresh() re-reads a label edited in place', async () => {
  const el = await mount(FIXTURE('value="banana"'));

  option(el, 'banana')!.textContent = 'Renamed';
  await el.refresh();

  await until(() => trigger(el).textContent?.includes('Renamed') === true, 'refresh to re-read');
});

// ─── Form association ───────────────────────────────────────────────────────

test('submits its value under its name', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="fruit" value="banana"')}</form>`;
  await customElements.whenDefined('pf-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['fruit', 'banana']]);
});

test('reflects name, so a property-setting binding still submits', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('value="banana"')}</form>`;
  await customElements.whenDefined('pf-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const el = document.querySelector('pf-select') as Select & { name: string };
  el.name = 'fruit';
  await until(() => el.getAttribute('name') === 'fruit', 'name to reflect');

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([['fruit', 'banana']]);
});

test('is absent from the submission when nothing is chosen', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="fruit"')}</form>`;
  await customElements.whenDefined('pf-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const data = new FormData(document.getElementById('f') as HTMLFormElement);
  expect([...data.entries()]).toEqual([]);
});

test('a form reset restores the value it started with', async () => {
  document.body.innerHTML = `<form id="f">${FIXTURE('name="fruit" value="banana"')}</form>`;
  await customElements.whenDefined('pf-select');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const el = document.querySelector('pf-select') as Select;

  el.value = 'cherry';
  await until(() => el.value === 'cherry');

  (document.getElementById('f') as HTMLFormElement).reset();
  await until(() => el.value === 'banana', 'the reset to restore the initial value');
});

test('a required select with nothing chosen is invalid, and says why', async () => {
  const el = await mount(FIXTURE('name="fruit" required'));

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('This field is required.');

  el.value = 'banana';
  await until(() => el.value === 'banana');
  expect(await el.checkValidity()).toBe(true);
});

test('an error message wins over the required message', async () => {
  const el = await mount(FIXTURE('name="fruit" required error="Pick something in season"'));

  expect(await el.checkValidity()).toBe(false);
  expect(await el.getValidationMessage()).toBe('Pick something in season');
});

test('marks the trigger invalid and wires the message to it', async () => {
  const el = await mount(FIXTURE('error="Pick something in season"'));

  expect(trigger(el).getAttribute('aria-invalid')).toBe('true');
  expect(trigger(el).getAttribute('aria-describedby')).toContain('error');
  expect(el.shadowRoot?.getElementById('error')?.textContent).toBe('Pick something in season');
});

test('labels the trigger', async () => {
  const el = await mount(FIXTURE('label="Fruit"'));

  expect((part(el, 'label') as HTMLLabelElement).htmlFor).toBe('trigger');
  expect(trigger(el).id).toBe('trigger');
});
