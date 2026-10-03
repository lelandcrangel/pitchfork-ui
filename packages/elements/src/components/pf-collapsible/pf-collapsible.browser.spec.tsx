/**
 * What the fast project cannot see: Escape, which reads `composedPath()`;
 * `inert` refusing real focus; and the panel animation, which needs layout.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-collapsible';
import '../pf-icon/pf-icon';

type Collapsible = HTMLElement & { open: boolean };

const FIXTURE = (attrs = '') => `
  <pf-collapsible ${attrs}>
    <span slot="trigger">Advanced options</span>
    <p><a href="#inside">A link inside the panel</a></p>
  </pf-collapsible>`;

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-collapsible');
  await frame();
  await frame();
  return document.querySelector('pf-collapsible') as Collapsible;
};

const until = async (predicate: () => boolean, label = 'pf-collapsible') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: Collapsible, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

test('Escape on the header closes it', async () => {
  const el = await mount(FIXTURE('open'));

  (part(el, 'trigger') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Escape}');
  await until(() => !el.open, 'Escape');
});

/*
 * Escape inside the content belongs to whatever is in there — a dialog, or a
 * field clearing itself — so this element leaves it alone. The handler is on
 * the host, where every key arrives, which is why `composedPath()[0]` is what
 * tells the two apart: `event.target` reads as the host either way.
 */
test('Escape inside the content is left alone', async () => {
  const el = await mount(FIXTURE('open'));
  const link = el.querySelector('a[href="#inside"]') as HTMLAnchorElement;

  link.focus();
  await userEvent.keyboard('{Escape}');
  await frame();
  await frame();

  expect(el.open).toBe(true);
});

test('a closed panel takes no focus', async () => {
  const el = await mount(FIXTURE('open'));
  const link = el.querySelector('a[href="#inside"]') as HTMLAnchorElement;

  link.focus();
  expect(document.activeElement).toBe(link);

  (part(el, 'trigger') as HTMLButtonElement).click();
  await until(() => !el.open, 'closing');
  await until(() => part(el, 'content').hasAttribute('inert'), 'inert');

  (document.activeElement as HTMLElement)?.blur();
  link.focus();
  expect(document.activeElement).not.toBe(link);
});

/* The header is an ordinary button, so these come from the platform. */
test('Enter and Space on the header toggle it', async () => {
  const el = await mount(FIXTURE());

  (part(el, 'trigger') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Enter}');
  await until(() => el.open, 'Enter');

  await userEvent.keyboard(' ');
  await until(() => !el.open, 'Space');
});

/*
 * The 0fr → 1fr technique animates `grid-template-rows`, which is what makes
 * the panel animate to the content's own height. Asserted with
 * `getAnimations()`, because a computed `transition` reports whatever was
 * declared whether or not its tokens resolve. The stylesheet is not applied in
 * either test project, so the transition is declared inline; the real
 * stylesheet's own value is asserted in `scripts/smoke-consumer.mjs`.
 */
test('the panel animates its height rather than snapping', async () => {
  const el = await mount(FIXTURE());
  const panel = part(el, 'panel');
  Object.assign(panel.style, {
    display: 'grid',
    gridTemplateRows: '0fr',
    transition: 'grid-template-rows 200ms linear',
  });
  await frame();

  (part(el, 'trigger') as HTMLButtonElement).click();
  await until(() => el.open, 'opening');
  panel.style.gridTemplateRows = '1fr';
  await until(() => panel.getAnimations().length > 0, 'an animation to wait on');

  const [animation] = panel.getAnimations();
  expect((animation as CSSTransition).transitionProperty).toBe('grid-template-rows');
  await animation.finished;
  expect(part(el, 'content').getBoundingClientRect().height).toBeGreaterThan(0);
});
