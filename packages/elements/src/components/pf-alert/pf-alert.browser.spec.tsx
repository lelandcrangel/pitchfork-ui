/**
 * The dismiss, which waits on a real animation, and `slotchange`, which the
 * mock DOM never fires.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-alert';

type Alert = HTMLElement & { dismiss(): Promise<void>; description?: string };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-alert');
  await frame();
  await frame();
  return document.querySelector('pf-alert') as Alert;
};

const until = async (predicate: () => boolean, label = 'pf-alert') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Alert, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The dismiss resolves even though nothing is animating — neither test
 * project applies `styleUrl` CSS, so there is no exit animation here at all.
 * An `animationend` listener would wait for ever and a timeout would be a
 * fiction; `animationsFinished` asks and gets an empty list.
 */
test('dismissing resolves and reports, with no animation to wait for', async () => {
  const el = await mount('<pf-alert dismissible heading="Saved">Done</pf-alert>');
  let heard = 0;
  el.addEventListener('pfDismiss', () => {
    heard += 1;
  });

  await userEvent.click(part(el, 'dismiss'));
  await until(() => heard === 1, 'the dismiss');
  expect(part(el, 'alert').className).toContain('alert--exiting');
});

test('a second dismiss is ignored', async () => {
  const el = await mount('<pf-alert dismissible>Done</pf-alert>');
  let heard = 0;
  el.addEventListener('pfDismiss', () => {
    heard += 1;
  });

  await el.dismiss();
  await el.dismiss();
  await frame();

  expect(heard).toBe(1);
});

/* The alert is still in the page afterwards: removing it is the consumer's. */
test('it leaves itself in the page for the consumer to remove', async () => {
  const el = await mount('<pf-alert dismissible>Done</pf-alert>');
  await el.dismiss();
  await frame();

  expect(document.querySelector('pf-alert')).toBe(el);
});

/*
 * `slotchange`, which the mock DOM never fires: a body slotted after mount
 * uncollapses the box, which is why the slot stays rendered inside it.
 */
test('a body slotted later uncollapses its box', async () => {
  const el = await mount('<pf-alert heading="Only a heading"></pf-alert>');
  const body = () => part(el, 'body');

  expect(body().className).toContain('empty');
  expect(body().querySelector('slot')).toBeTruthy();

  const text = document.createElement('span');
  text.textContent = 'And now a body.';
  el.appendChild(text);

  await until(() => !body().className.includes('empty'), 'the body box');
  expect((body().querySelector('slot') as HTMLSlotElement).assignedElements()[0].textContent).toBe(
    'And now a body.',
  );
});

/* A consumer's own icon replaces the variant's. */
test('a slotted icon replaces the one the variant chose', async () => {
  const el = await mount('<pf-alert variant="danger"><span slot="icon">!</span>Bad</pf-alert>');
  const slot = part(el, 'icon').querySelector('slot[name="icon"]') as HTMLSlotElement;

  expect(slot.assignedElements()[0].textContent).toBe('!');
  // The fallback is still in the tree, just unused.
  expect(slot.querySelector('pf-icon')).toBeTruthy();
});

/* The role mapping, which is what decides whether a reader is interrupted. */
test('the role follows the variant', async () => {
  for (const [variant, role] of [
    ['info', 'status'],
    ['success', 'status'],
    ['warning', 'alert'],
    ['danger', 'alert'],
  ] as const) {
    document.body.innerHTML = '';
    const el = await mount(`<pf-alert variant="${variant}">Message</pf-alert>`);
    expect(part(el, 'alert').getAttribute('role')).toBe(role);
  }
});
