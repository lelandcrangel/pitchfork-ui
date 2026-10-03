/**
 * pf-slideout-menu is browser-tested, all of it: `<dialog>.showModal()`, the
 * top layer, the native focus trap and the page-scroll lock are none of them
 * things the mock DOM has, and neither is `slotchange`.
 *
 * Escape and overlay clicks go through `userEvent`, because the dialog's own
 * Escape handling responds to trusted input only — measured.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-slideout-menu';
import '../pf-modal/pf-modal';

type Slideout = HTMLElement & {
  open: boolean;
  dismissable: boolean;
  placement: string;
  show(): Promise<void>;
  hide(): Promise<void>;
};

const FIXTURE = (attrs = '', footer = '') => `
  <button type="button" id="outside">Outside</button>
  <pf-slideout-menu ${attrs}>
    <button type="button" id="inside">Inside</button>
    ${footer}
  </pf-slideout-menu>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-slideout-menu');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-slideout-menu') as Slideout;
};

const until = async (predicate: () => boolean, label = 'pf-slideout-menu') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const dialog = (el: Slideout) => el.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
const part = (el: Slideout, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

afterEach(() => {
  // A leaked scroll lock would silently break every later test.
  document.body.innerHTML = '';
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

/*
 * The reason this is a <dialog> and not a positioned div: the React component
 * hand-rolls a focus trap, a focusin listener and focus restoration to get
 * what showModal() gives for nothing.
 */
test('moves focus inside and will not let a light-DOM button take it back', async () => {
  const el = await mount(FIXTURE());
  const outside = document.getElementById('outside') as HTMLButtonElement;

  await el.show();
  await until(() => dialog(el).open);

  expect(el.contains(document.activeElement) || el.shadowRoot?.activeElement).toBeTruthy();

  outside.focus();
  expect(document.activeElement).not.toBe(outside);
});

test('a real Escape closes it', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.keyboard('{Escape}');
  await until(() => !dialog(el).open, 'Escape to close it');
  expect(el.open).toBe(false);
});

/* dismissable="false" blocks the `cancel` event, which is how Escape is refused. */
test('a real Escape does not close a non-dismissable panel', async () => {
  const el = await mount(FIXTURE('dismissable="false"'));
  await el.show();
  await until(() => dialog(el).open);

  await userEvent.keyboard('{Escape}');
  await new Promise((resolve) => setTimeout(resolve, 150));

  expect(dialog(el).open).toBe(true);
  expect(el.open).toBe(true);
});

/* The panel is an inner box, so a click on the dialog itself missed it. */
test('a click on the overlay closes it, a click on the panel does not', async () => {
  const el = await mount(FIXTURE());
  await el.show();
  await until(() => dialog(el).open);

  part(el, 'panel')?.click();
  expect(dialog(el).open).toBe(true);

  dialog(el).click();
  await until(() => !dialog(el).open, 'the overlay click to close it');
});

/*
 * showModal() does not lock page scroll — measured — so the element does it,
 * through core's reference-counted lock.
 */
test('locks page scroll while open and gives it back on close', async () => {
  const el = await mount(FIXTURE());

  expect(document.documentElement.style.overflow).toBe('');
  await el.show();
  await until(() => document.documentElement.style.overflow === 'hidden');

  await el.hide();
  await until(() => document.documentElement.style.overflow === '', 'the scroll lock to lift');
});

/*
 * The case the reference count exists for. Two overlays each remembering "the
 * previous overflow" independently leaves the page locked for good: the second
 * to open records `hidden` as the value to restore.
 */
test('a slideout over a modal does not leave the page locked', async () => {
  document.body.innerHTML = `
    <pf-modal label="Behind"><p>Behind</p></pf-modal>
    <pf-slideout-menu heading="In front"><p>In front</p></pf-slideout-menu>`;
  await customElements.whenDefined('pf-modal');
  await customElements.whenDefined('pf-slideout-menu');
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const modal = document.querySelector('pf-modal') as Slideout;
  const slideout = document.querySelector('pf-slideout-menu') as Slideout;

  await modal.show();
  await slideout.show();
  await until(() => document.documentElement.style.overflow === 'hidden');

  await slideout.hide();
  expect(document.documentElement.style.overflow).toBe('hidden');

  await modal.hide();
  await until(() => document.documentElement.style.overflow === '', 'the last lock to lift');
});

/*
 * Emitted from @Watch rather than from the `close` handler: by the time a DOM
 * event arrives the element has already moved its own `open`, so a guard there
 * sees no change and fires for the browser path only.
 */
test('announces every open and close, whoever caused it', async () => {
  const el = await mount(FIXTURE());
  const seen: boolean[] = [];
  el.addEventListener('pfOpenChange', (event) => {
    seen.push((event as CustomEvent<{ open: boolean }>).detail.open);
  });

  await el.show();
  await until(() => dialog(el).open);
  await el.hide();
  await until(() => !dialog(el).open);

  await el.show();
  await until(() => dialog(el).open);
  await userEvent.keyboard('{Escape}');
  await until(() => !dialog(el).open);

  expect(seen).toEqual([true, false, true, false]);
});

/*
 * An IDREF works here and not in pf-modal: this heading is a prop rendered
 * into this element's own shadow root, so the reference never crosses a
 * boundary. pf-modal's header is slotted light DOM, which is why it has to
 * copy text into aria-label instead.
 */
test('names itself with aria-labelledby when it has a heading', async () => {
  const el = await mount(FIXTURE('heading="Filters" description="Narrow the list"'));

  expect(dialog(el).getAttribute('aria-labelledby')).toBe('title');
  expect(dialog(el).hasAttribute('aria-label')).toBe(false);
  expect(el.shadowRoot?.getElementById('title')?.textContent).toBe('Filters');
  expect(dialog(el).getAttribute('aria-describedby')).toBe('description');
});

test('falls back to the label prop when there is no heading', async () => {
  const el = await mount(FIXTURE('label="Side panel"'));

  expect(dialog(el).getAttribute('aria-label')).toBe('Side panel');
  expect(dialog(el).hasAttribute('aria-labelledby')).toBe(false);
});

/*
 * The footer has a border and padding, so an empty one is visible. A wrapper
 * holding a <slot> cannot be collapsed from CSS — `:not(:has(*))` never
 * matches it, because the slot element is itself a child, measured — so the
 * element asks the slot instead.
 */
test('hides the footer until something is slotted into it', async () => {
  const el = await mount(FIXTURE());
  expect(part(el, 'footer')?.hasAttribute('hidden')).toBe(true);

  const withFooter = await mount(FIXTURE('', '<button type="button" slot="footer">Apply</button>'));
  expect(part(withFooter, 'footer')?.hasAttribute('hidden')).toBe(false);
});

/* slotchange, so a footer added after first paint appears. */
test('reveals the footer when one is added later', async () => {
  const el = await mount(FIXTURE());
  expect(part(el, 'footer')?.hasAttribute('hidden')).toBe(true);

  const button = document.createElement('button');
  button.setAttribute('slot', 'footer');
  button.textContent = 'Apply';
  el.appendChild(button);

  await until(
    () => part(el, 'footer')?.hasAttribute('hidden') === false,
    'the footer to appear on slotchange',
  );
});

/*
 * Only the reflected attribute, not the resulting geometry: neither test
 * project applies `styleUrl` CSS, so in here the dialog has the UA's
 * `margin: auto` and `width: fit-content` and the panel sits centred whatever
 * `placement` says. Which edge it actually lands on is asserted against a real
 * build in `scripts/smoke-consumer.mjs`.
 */
test('reflects the placement the stylesheet selects on', async () => {
  const right = await mount(FIXTURE('placement="right"'));
  expect(right.getAttribute('placement')).toBe('right');

  const left = await mount(FIXTURE('placement="left"'));
  expect(left.getAttribute('placement')).toBe('left');
});

test('reflects size and open, which the stylesheet also selects on', async () => {
  const el = await mount(FIXTURE('size="lg"'));
  expect(el.getAttribute('size')).toBe('lg');
  expect(el.hasAttribute('open')).toBe(false);

  await el.show();
  await until(() => el.hasAttribute('open'));
});
