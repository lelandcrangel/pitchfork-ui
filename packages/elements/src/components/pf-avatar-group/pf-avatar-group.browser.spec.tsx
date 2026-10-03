/**
 * `slotchange`, which the fast project never fires, and the two CSS claims
 * that do not need the component's own stylesheet: the ring and the overlap
 * are in `scripts/smoke-consumer.mjs`, but the selector that collapses an
 * avatar — `::slotted(pf-avatar:not(:first-child))` and friends — is worth
 * measuring here, because a compound selector inside `::slotted()` is the
 * thing being relied on.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-avatar-group';
import '../pf-avatar/pf-avatar';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-avatar-group');
  await customElements.whenDefined('pf-avatar');
  await frame();
  await frame();
  return document.querySelector('pf-avatar-group') as HTMLElement & {
    refresh(): Promise<void>;
  };
};

const until = async (predicate: () => boolean, label = 'pf-avatar-group') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const FIXTURE = `
  <pf-avatar-group max="2">
    <pf-avatar name="One"></pf-avatar>
    <pf-avatar name="Two"></pf-avatar>
  </pf-avatar-group>`;

const chip = (el: HTMLElement) => el.shadowRoot?.querySelector('[part="overflow"]');

afterEach(() => {
  document.body.innerHTML = '';
});

test('counts an avatar appended after mount', async () => {
  const el = await mount(FIXTURE);
  expect(chip(el)).toBeNull();
  expect(el.getAttribute('aria-label')).toBe('2 people');

  const added = document.createElement('pf-avatar');
  added.setAttribute('name', 'Three');
  el.append(added);

  await until(() => chip(el)?.textContent === '+1', 'the chip appearing');
  expect(added.hasAttribute('data-pf-overflow')).toBe(true);
  expect(el.getAttribute('aria-label')).toBe('3 people');
});

test('counts an avatar removed after mount', async () => {
  const el = await mount(`
    <pf-avatar-group max="1">
      <pf-avatar name="One"></pf-avatar>
      <pf-avatar name="Two"></pf-avatar>
    </pf-avatar-group>`);
  await until(() => chip(el)?.textContent === '+1', 'the chip');

  (el.querySelectorAll('pf-avatar')[1] as HTMLElement).remove();
  await until(() => chip(el) === null, 'the chip going');
  expect(el.getAttribute('aria-label')).toBe('1 person');
});

/*
 * The group pushes its own size down, so an avatar that arrives with a size of
 * its own is overruled — one group, one size, however the children were
 * written.
 */
test('pushes its size onto an avatar appended after mount', async () => {
  const el = await mount(`
    <pf-avatar-group size="lg" max="3">
      <pf-avatar name="One"></pf-avatar>
    </pf-avatar-group>`);

  const added = document.createElement('pf-avatar');
  added.setAttribute('name', 'Two');
  added.setAttribute('size', 'sm');
  el.append(added);

  await until(() => added.getAttribute('size') === 'lg', 'the size being pushed down');
});
