/**
 * A container's own events reach its listeners, and nothing from inside it
 * does.
 *
 * Each test puts a real control inside a real container, drives both, and
 * counts what the container's listener heard. Before the fix every container
 * that emitted `pfChange` heard each control inside it as itself, and every
 * overlay heard each overlay inside it: a `pf-select` closing in a `pf-modal`
 * told the modal's handler `{ open: false }`, which closes a dialog whose
 * `open` is bound to that handler. `scripts/check-event-bubbling.mjs` holds
 * the rule statically; these hold the behaviour.
 */
import { afterEach, expect, test } from 'vitest';
import './components/pf-accordion/pf-accordion';
import './components/pf-accordion-item/pf-accordion-item';
import './components/pf-alert/pf-alert';
import './components/pf-input/pf-input';
import './components/pf-modal/pf-modal';
import './components/pf-modal-body/pf-modal-body';
import './components/pf-option/pf-option';
import './components/pf-select/pf-select';
import './components/pf-switch/pf-switch';
import './components/pf-tab/pf-tab';
import './components/pf-tab-panel/pf-tab-panel';
import './components/pf-tabs/pf-tabs';
import './components/pf-tag/pf-tag';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frame();
  }
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await until(
    () =>
      Array.from(document.body.querySelectorAll('*'))
        .filter((el) => el.tagName.startsWith('PF-'))
        .every((el) => el.classList.contains('hydrated')),
    'hydration',
  );
  await frame();
};

const shadow = <T extends Element>(host: Element, selector: string) =>
  host.shadowRoot!.querySelector(selector) as T;

/** Every event of these names that reaches `target`, as `name:detail`. */
const record = (target: Element, names: string[]) => {
  const heard: string[] = [];
  for (const name of names) {
    target.addEventListener(name, (event) =>
      heard.push(`${name}:${JSON.stringify((event as CustomEvent).detail ?? null)}`),
    );
  }
  return heard;
};

afterEach(() => {
  document.body.innerHTML = '';
});

test('pf-tabs hears its own tab change and not a switch in its panel', async () => {
  await mount(`
    <pf-tabs value="one">
      <pf-tab value="one">One</pf-tab>
      <pf-tab-panel value="one"><pf-switch label="Notify"></pf-switch></pf-tab-panel>
      <pf-tab value="two">Two</pf-tab>
      <pf-tab-panel value="two">Second</pf-tab-panel>
    </pf-tabs>`);
  const tabs = document.querySelector('pf-tabs')!;
  const heard = record(tabs, ['pfTabChange', 'pfChange']);

  shadow<HTMLInputElement>(document.querySelector('pf-switch')!, 'input').click();
  await sleep(50);
  // The switch's own pfChange still bubbles, as a native change does -- but
  // under its own name, so the tabs' event is untouched.
  expect(heard).toEqual(['pfChange:{"checked":true,"value":"on"}']);

  (document.querySelectorAll('pf-tab')[1] as HTMLElement).click();
  await until(() => heard.length === 2, 'the tab change');
  expect(heard[1]).toBe('pfTabChange:{"value":"two"}');
});

test('pf-accordion hears its own toggle and not an input inside a section', async () => {
  await mount(`
    <pf-accordion>
      <pf-accordion-item value="a">
        <span slot="title">A</span>
        <pf-input label="Name"></pf-input>
      </pf-accordion-item>
    </pf-accordion>`);
  const accordion = document.querySelector('pf-accordion')!;
  const heard = record(accordion, ['pfExpandedChange']);

  const input = shadow<HTMLInputElement>(document.querySelector('pf-input')!, 'input');
  input.value = 'Ada';
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  await sleep(50);
  expect(heard).toEqual([]);

  shadow<HTMLButtonElement>(document.querySelector('pf-accordion-item')!, 'button').click();
  await until(() => heard.length === 1, 'the accordion change');
  expect(heard[0]).toBe('pfExpandedChange:{"value":"a","values":["a"]}');
});

test('a pf-select opening and closing inside a pf-modal does not report the modal', async () => {
  await mount(`
    <pf-modal label="Edit">
      <pf-modal-body>
        <pf-select label="Plan"><pf-option value="pro">Pro</pf-option></pf-select>
      </pf-modal-body>
    </pf-modal>`);
  const modal = document.querySelector('pf-modal') as HTMLElement & { open: boolean };
  const select = document.querySelector('pf-select') as HTMLElement & { open: boolean };
  modal.open = true;
  await until(() => shadow<HTMLDialogElement>(modal, 'dialog').open, 'the modal to open');

  // The consumer's handler, bound the way a framework binds `open`.
  const heard = record(modal, ['pfOpenChange']);
  modal.addEventListener('pfOpenChange', (event) => {
    modal.open = (event as CustomEvent<{ open: boolean }>).detail.open;
  });

  select.open = true;
  await sleep(50);
  select.open = false;
  await sleep(50);

  expect(heard).toEqual([]);
  expect(shadow<HTMLDialogElement>(modal, 'dialog').open).toBe(true);

  modal.open = false;
  await until(() => heard.length === 1, 'the modal to report closing');
  expect(heard[0]).toBe('pfOpenChange:{"open":false}');
});

test('dismissing a pf-tag inside a pf-alert does not dismiss the alert', async () => {
  await mount(`
    <pf-alert heading="Filters" dismissible>
      <pf-tag dismissible>status: open</pf-tag>
    </pf-alert>`);
  const alert = document.querySelector('pf-alert') as HTMLElement & { dismiss(): Promise<void> };
  const tag = document.querySelector('pf-tag')!;
  const heardByAlert = record(alert, ['pfDismiss']);
  const heardByTag = record(tag, ['pfDismiss']);

  shadow<HTMLButtonElement>(tag, 'button').click();
  await sleep(50);
  expect(heardByTag).toEqual(['pfDismiss:null']);
  expect(heardByAlert).toEqual([]);

  await alert.dismiss();
  await until(() => heardByAlert.length === 1, 'the alert to report dismissal');
});

/*
 * The half of the rule that must not change: a form control's value events
 * still bubble, so a listener on the form hears every control in it, the way
 * it hears native `change`.
 */
test('a form control inside a container still reaches a listener on the form', async () => {
  await mount(`
    <form>
      <pf-tabs value="one">
        <pf-tab value="one">One</pf-tab>
        <pf-tab-panel value="one"><pf-switch name="notify" label="Notify"></pf-switch></pf-tab-panel>
      </pf-tabs>
    </form>`);
  const heard = record(document.querySelector('form')!, ['pfChange']);

  shadow<HTMLInputElement>(document.querySelector('pf-switch')!, 'input').click();
  await until(() => heard.length === 1, 'the switch to reach the form');
  expect(heard[0]).toBe('pfChange:{"checked":true,"value":"on"}');
});
