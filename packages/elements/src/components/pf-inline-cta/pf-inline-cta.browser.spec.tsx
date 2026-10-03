/**
 * The exit animation, which needs layout and a real stylesheet's worth of
 * animation — declared inline here, since neither test project applies
 * `styleUrl` CSS — and `slotchange`, which the fast project never fires.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-inline-cta';
import '../pf-icon/pf-icon';

type InlineCta = HTMLElement & { exiting: boolean; dismiss(): Promise<void> };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-inline-cta');
  await frame();
  await frame();
  return document.querySelector('pf-inline-cta') as InlineCta;
};

const until = async (predicate: () => boolean, label = 'pf-inline-cta') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: InlineCta, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;

/* The stylesheet's own animation is asserted in scripts/smoke-consumer.mjs. */
const animateExit = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes probe-out { from { opacity: 1 } to { opacity: 0 } }
    pf-inline-cta[exiting] { animation: probe-out 150ms linear forwards }`;
  document.head.append(style);
  return () => style.remove();
};

afterEach(() => {
  document.body.innerHTML = '';
  document.head.querySelectorAll('style').forEach((node) => node.remove());
});

/*
 * The point of waiting on `Animation.finished` rather than a timeout: the
 * event lands when the animation is actually over, whatever its duration.
 */
test('waits for the exit animation before reporting', async () => {
  const el = await mount(`<pf-inline-cta dismissible>Finish setting up</pf-inline-cta>`);
  animateExit();
  const dismissed: number[] = [];
  el.addEventListener('pfDismiss', () => dismissed.push(performance.now()));

  const started = performance.now();
  await el.dismiss();

  expect(dismissed).toHaveLength(1);
  // The animation is 150ms, so an event that arrived at once would be wrong.
  expect(dismissed[0] - started).toBeGreaterThan(100);
  expect(el.getAnimations().every((animation) => animation.playState === 'finished')).toBe(true);
});

test('the dismiss button starts it', async () => {
  const el = await mount(`<pf-inline-cta dismissible>Finish setting up</pf-inline-cta>`);
  animateExit();
  const dismissed: string[] = [];
  el.addEventListener('pfDismiss', () => dismissed.push('gone'));

  await userEvent.click(part(el, 'dismiss'));

  await until(() => el.exiting, 'the exit starting');
  await until(() => dismissed.length === 1, 'the exit finishing');
});

/*
 * With no animation at all — which is `prefers-reduced-motion`, and a consumer
 * who has not loaded the stylesheet — the promise still has to resolve. An
 * `animationend` listener would hang here, which is the measured reason
 * pf-notification does it this way too.
 */
test('resolves at once when nothing animates', async () => {
  const el = await mount(`<pf-inline-cta dismissible>Finish setting up</pf-inline-cta>`);
  const dismissed: string[] = [];
  el.addEventListener('pfDismiss', () => dismissed.push('gone'));

  const started = performance.now();
  await el.dismiss();

  expect(dismissed).toEqual(['gone']);
  expect(performance.now() - started).toBeLessThan(100);
});

test('notices an action slotted in after mount', async () => {
  const el = await mount(`<pf-inline-cta>Finish setting up</pf-inline-cta>`);
  expect(part(el, 'action').classList.contains('empty')).toBe(true);

  const button = document.createElement('button');
  button.slot = 'action';
  button.textContent = 'Continue';
  el.append(button);

  await until(() => !part(el, 'action').classList.contains('empty'), 'the action box appearing');
});
