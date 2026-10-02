/**
 * The parts of pf-notification the mock DOM cannot reach: the exit path, which
 * waits on real animations, and `slotchange`.
 */
import { expect, test } from 'vitest';
import './pf-notification';

type Notification = HTMLElement & {
  exiting: boolean;
  dismiss(): Promise<void>;
};

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-notification');
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return document.querySelector('pf-notification') as Notification;
};

const until = async (predicate: () => boolean, label = 'pf-notification') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
};

const part = (el: Notification, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

/*
 * The reason the exit waits on `getAnimations()` rather than on an
 * `animationend` listener. No `styleUrl` CSS is applied in either test
 * project, so nothing animates here at all — and a listener-based dismiss
 * would never resolve, in exactly the same way it would never resolve under
 * `prefers-reduced-motion`, where the stylesheet sets `animation: none`. This
 * test passing *is* that claim: it would time out against the other design.
 */
test('dismiss() resolves and reports even when nothing animates', async () => {
  const el = await mount('<pf-notification heading="Bye" dismissable></pf-notification>');
  let reported = false;
  el.addEventListener('pfDismiss', () => {
    reported = true;
  });

  expect(el.shadowRoot?.querySelector('[part="notification"]')?.getAnimations()).toHaveLength(0);

  await el.dismiss();
  expect(reported).toBe(true);
});

test('reflects exiting while it is leaving, for the stylesheet to select on', async () => {
  const el = await mount('<pf-notification heading="Bye"></pf-notification>');

  expect(el.hasAttribute('exiting')).toBe(false);
  await el.dismiss();
  expect(el.hasAttribute('exiting')).toBe(true);
});

/* The owner removes it on pfDismiss; a second call must not report again. */
test('dismissing twice reports once', async () => {
  const el = await mount('<pf-notification heading="Bye"></pf-notification>');
  let count = 0;
  el.addEventListener('pfDismiss', () => {
    count += 1;
  });

  await el.dismiss();
  await el.dismiss();
  expect(count).toBe(1);
});

test('the dismiss button starts the exit', async () => {
  const el = await mount('<pf-notification heading="Bye" dismissable></pf-notification>');
  let reported = false;
  el.addEventListener('pfDismiss', () => {
    reported = true;
  });

  (part(el, 'dismiss') as HTMLButtonElement).click();
  await until(() => reported, 'the click to report a dismissal');
});

/* slotchange, which the mock DOM never fires. */
test('reveals the body when content is slotted in later', async () => {
  const el = await mount('<pf-notification heading="Only a heading"></pf-notification>');
  expect(part(el, 'body')?.hasAttribute('hidden')).toBe(true);

  el.appendChild(document.createTextNode('Something to say'));

  await until(
    () => part(el, 'body')?.hasAttribute('hidden') === false,
    'the body to appear on slotchange',
  );
});
