/**
 * pf-modal is tested in a real browser, all of it: `<dialog>.showModal()`, the
 * top layer, the native focus trap and the scroll lock are none of them things
 * the mock DOM has.
 *
 * Escape and overlay clicks go through `userEvent`, because light-dismiss and
 * the dialog's own Escape handling respond to trusted input only — measured.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-modal';
import '../pf-modal-header/pf-modal-header';
import '../pf-modal-body/pf-modal-body';
import '../pf-modal-footer/pf-modal-footer';

type Modal = HTMLElement & {
  open: boolean;
  dismissable: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
};

const FIXTURE = (attrs = '') => `
  <button type="button" id="outside">Outside</button>
  <pf-modal ${attrs}>
    <pf-modal-header><h2>Confirm</h2></pf-modal-header>
    <pf-modal-body>Are you sure?</pf-modal-body>
    <pf-modal-footer>
      <button type="button" id="cancel">Cancel</button>
      <button type="button" id="confirm">Confirm</button>
    </pf-modal-footer>
  </pf-modal>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-modal');
  await customElements.whenDefined('pf-modal-header');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-modal') as Modal;
};

const until = async (predicate: () => boolean, label = 'pf-modal') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const dialog = (el: Modal) => el.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
const closeButton = (el: Modal) =>
  el.shadowRoot?.querySelector('[part="close"]') as HTMLButtonElement;

afterEach(() => {
  // A leaked scroll lock would silently break every later test.
  document.documentElement.style.overflow = '';
});

test('is closed to begin with, and its dialog is a real dialog', async () => {
  const el = await mount(FIXTURE());

  expect(dialog(el).tagName).toBe('DIALOG');
  expect(dialog(el).open).toBe(false);
});

test('show() opens it as a modal dialog', async () => {
  const el = await mount(FIXTURE());

  await el.show();
  await until(() => dialog(el).open);
  expect(el.open).toBe(true);
});

test('names itself from the label prop', async () => {
  const el = await mount(FIXTURE('label="Delete account"'));

  expect(dialog(el).getAttribute('aria-label')).toBe('Delete account');
});

/*
 * `aria-labelledby` is not available: the heading is in the light DOM and the
 * dialog is in the shadow root, and an IDREF does not cross that. The slotted
 * text is copied instead.
 */
test('falls back to the slotted text for its accessible name', async () => {
  const el = await mount(FIXTURE());

  expect(dialog(el).getAttribute('aria-label')).toContain('Confirm');
});

/* Measured: showModal() moves focus inside and will not give it up. */
test('traps focus natively — the page cannot take it back', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  const before = el.shadowRoot?.activeElement;
  expect(before).not.toBeNull();

  (document.getElementById('outside') as HTMLElement).focus();

  expect(document.activeElement).not.toBe(document.getElementById('outside'));
  expect(el.shadowRoot?.activeElement).toBe(before);
});

/*
 * showModal() does not lock page scroll — measured, a real wheel scrolled the
 * page behind an open modal — so the element does it, as React's does.
 */
test('locks page scroll while open and restores it on close', async () => {
  const el = await mount(FIXTURE());
  document.documentElement.style.overflow = 'auto';

  await el.show();
  await until(() => dialog(el).open);
  expect(document.documentElement.style.overflow).toBe('hidden');

  await el.hide();
  await until(() => !dialog(el).open);
  expect(document.documentElement.style.overflow).toBe('auto');
});

test('does not leave the page locked when removed while open', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);
  expect(document.documentElement.style.overflow).toBe('hidden');

  el.remove();
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(document.documentElement.style.overflow).not.toBe('hidden');
});

test('the close button closes it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.click(closeButton(el));
  await until(() => !el.open);
});

test('omits the close button on request', async () => {
  const el = await mount(FIXTURE('show-close-button="false"'));

  expect(closeButton(el)).toBeNull();
});

/* The dialog's own Escape handling, which fires `cancel` then `close`. */
test('a real Escape closes it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.keyboard('{Escape}');
  await until(() => !el.open, 'the modal to close on Escape');
});

/* Blocking `cancel` is how a non-dismissable modal refuses Escape. */
test('a non-dismissable modal ignores Escape', async () => {
  const el = await mount(FIXTURE('dismissable="false"'));
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.keyboard('{Escape}');
  await new Promise((resolve) => setTimeout(resolve, 150));

  expect(el.open).toBe(true);
  expect(dialog(el).open).toBe(true);
});

/*
 * The dialog element fills the viewport and centres an inner panel, so a click
 * that lands on the dialog rather than the panel is an overlay click.
 */
test('a click on the overlay closes it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  // The very corner of the dialog box: outside the centred panel.
  const box = dialog(el).getBoundingClientRect();
  await userEvent.click(dialog(el), { position: { x: 2, y: 2 } });
  void box;
  await until(() => !el.open, 'the modal to close on an overlay click');
});

test('a click inside the panel does not close it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.click(document.getElementById('cancel') as HTMLElement);
  await new Promise((resolve) => setTimeout(resolve, 150));

  expect(el.open).toBe(true);
});

test('a non-dismissable modal ignores an overlay click', async () => {
  const el = await mount(FIXTURE('dismissable="false"'));
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.click(dialog(el), { position: { x: 2, y: 2 } });
  await new Promise((resolve) => setTimeout(resolve, 150));

  expect(el.open).toBe(true);
});

/* Every close path has to reach the consumer, not just the ones they drove. */
test('reports each state change once through pfOpenChange', async () => {
  const el = await mount(FIXTURE());
  const seen: boolean[] = [];
  el.addEventListener('pfOpenChange', (e) =>
    seen.push((e as CustomEvent<{ open: boolean }>).detail.open),
  );

  await el.show();
  await until(() => dialog(el).open);
  await userEvent.keyboard('{Escape}');
  await until(() => !el.open);

  expect(seen).toEqual([true, false]);
});

test('reflects open and size for the stylesheet', async () => {
  const el = await mount(FIXTURE('size="lg"'));
  expect(el.getAttribute('size')).toBe('lg');
  expect(el.hasAttribute('open')).toBe(false);

  await el.show();
  await until(() => el.hasAttribute('open'));
});

test('renders its three sections as separate elements', async () => {
  const el = await mount(FIXTURE());

  expect(el.querySelector('pf-modal-header')?.shadowRoot).not.toBeNull();
  expect(el.querySelector('pf-modal-body')?.shadowRoot).not.toBeNull();
  expect(el.querySelector('pf-modal-footer')?.shadowRoot).not.toBeNull();
});
