/**
 * What the fast project cannot see: real focus, so the arrows have a header to
 * move from and `delegatesFocus` has somewhere to land; `slotchange`, which
 * the mock DOM never fires; and the panel animation, which needs layout.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-accordion';
import '../pf-accordion-item/pf-accordion-item';
import '../pf-icon/pf-icon';

type Accordion = HTMLElement & { value: string; refresh(): Promise<void> };

const FIXTURE = (attrs = '') => `
  <pf-accordion ${attrs}>
    <pf-accordion-item value="shipping">
      <span slot="title">Shipping</span>
      <p><a href="#inside">A link inside the panel</a></p>
    </pf-accordion-item>
    <pf-accordion-item value="returns">
      <span slot="title">Returns</span>
      <p>Thirty days.</p>
    </pf-accordion-item>
    <pf-accordion-item value="warranty" disabled>
      <span slot="title">Warranty</span>
      <p>One year.</p>
    </pf-accordion-item>
  </pf-accordion>`;

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-accordion');
  await customElements.whenDefined('pf-accordion-item');
  await frame();
  await frame();
  return document.querySelector('pf-accordion') as Accordion;
};

/* Stencil's queue is async, so a re-render lands some frames after the event. */
const until = async (predicate: () => boolean, label = 'pf-accordion') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const item = (el: Accordion, value: string) =>
  el.querySelector(`pf-accordion-item[value="${value}"]`) as HTMLElement;
const part = (host: HTMLElement, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const trigger = (el: Accordion, value: string) =>
  part(item(el, value), 'trigger') as HTMLButtonElement;
const focusedValue = () => (document.activeElement as HTMLElement)?.getAttribute('value') ?? null;

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * `activeElement` at the document reports the shallowest host, so a header
 * inside a shadow root reads as its `pf-accordion-item` — which is the element
 * the group's index arithmetic runs over.
 */
test('the arrows move focus between the headers', async () => {
  const el = await mount(FIXTURE());

  trigger(el, 'shipping').focus();
  expect(focusedValue()).toBe('shipping');

  await userEvent.keyboard('{ArrowDown}');
  await until(() => focusedValue() === 'returns', 'ArrowDown');

  await userEvent.keyboard('{ArrowUp}');
  await until(() => focusedValue() === 'shipping', 'ArrowUp');
});

/* The third section is disabled, so Down from the second wraps to the first. */
test('the arrows skip a disabled header, and wrap', async () => {
  const el = await mount(FIXTURE());

  trigger(el, 'returns').focus();
  await userEvent.keyboard('{ArrowDown}');
  await until(() => focusedValue() === 'shipping', 'wrap forwards');

  await userEvent.keyboard('{ArrowUp}');
  await until(() => focusedValue() === 'returns', 'wrap backwards');
});

test('Home and End jump to the first and last enabled header', async () => {
  const el = await mount(FIXTURE());

  trigger(el, 'returns').focus();
  await userEvent.keyboard('{End}');
  await until(() => focusedValue() === 'returns', 'End');

  await userEvent.keyboard('{Home}');
  await until(() => focusedValue() === 'shipping', 'Home');
});

/* The arrows move and nothing else: a section is opened deliberately. */
test('the arrows open nothing', async () => {
  const el = await mount(FIXTURE());

  trigger(el, 'shipping').focus();
  await userEvent.keyboard('{ArrowDown}');
  await until(() => focusedValue() === 'returns', 'ArrowDown');

  expect(el.value).toBe('');
  expect(el.querySelectorAll('pf-accordion-item[expanded]').length).toBe(0);
});

/* The group hands focus to the host; `delegatesFocus` passes it to the button. */
test('focusing the host lands on the header button', async () => {
  const el = await mount(FIXTURE());

  item(el, 'returns').focus();
  expect(item(el, 'returns').shadowRoot?.activeElement).toBe(trigger(el, 'returns'));
});

/* Every header is in the tab sequence — this is not a roving tabindex. */
test('every enabled header is a tab stop', async () => {
  document.body.innerHTML = `<button id="before">before</button>${FIXTURE()}`;
  await customElements.whenDefined('pf-accordion-item');
  await frame();
  await frame();
  (document.getElementById('before') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Tab}');
  expect(focusedValue()).toBe('shipping');

  await userEvent.keyboard('{Tab}');
  expect(focusedValue()).toBe('returns');

  // Past the disabled one, which no amount of tabbing reaches.
  await userEvent.keyboard('{Tab}');
  expect(focusedValue()).toBeNull();
});

test('Enter on a header opens its section', async () => {
  const el = await mount(FIXTURE());

  trigger(el, 'returns').focus();
  await userEvent.keyboard('{Enter}');
  await until(() => el.value === 'returns', 'Enter');

  await userEvent.keyboard(' ');
  await until(() => el.value === '', 'Space');
});

/*
 * The one thing the collapsed height cannot do on its own: a panel animating
 * to zero still holds focusable content, so without `inert` the next Tab from
 * a closed header lands inside the box it just closed.
 */
test('a closed panel takes no focus', async () => {
  const el = await mount(FIXTURE('value="shipping"'));
  const link = el.querySelector('a[href="#inside"]') as HTMLAnchorElement;

  link.focus();
  expect(document.activeElement).toBe(link);

  trigger(el, 'shipping').click();
  await until(() => el.value === '', 'closing');
  await until(() => part(item(el, 'shipping'), 'content').hasAttribute('inert'), 'inert');

  (document.activeElement as HTMLElement)?.blur();
  link.focus();
  expect(document.activeElement).not.toBe(link);
});

/*
 * The 0fr → 1fr technique animates `grid-template-rows`, which is what makes
 * it animate to the content's own height rather than to a guess. Asserted with
 * `getAnimations()`, because a computed `transition` reports whatever was
 * declared whether or not it resolves — an undefined duration token computes
 * the whole shorthand away, and the panel would snap open with nothing to see.
 *
 * The stylesheet is not applied in either test project, so the transition is
 * declared inline here; what is being checked is that the property animates at
 * all under this element's own open/close, not the stylesheet's value.
 */
test('the panel animates its height rather than snapping', async () => {
  const el = await mount(FIXTURE());
  const panel = part(item(el, 'returns'), 'panel');
  Object.assign(panel.style, {
    display: 'grid',
    gridTemplateRows: '0fr',
    transition: 'grid-template-rows 200ms linear',
  });
  await frame();

  panel.style.gridTemplateRows = '1fr';
  await until(() => panel.getAnimations().length > 0, 'an animation to wait on');
  const [animation] = panel.getAnimations();
  expect((animation as CSSTransition).transitionProperty).toBe('grid-template-rows');
  await animation.finished;
  expect(part(item(el, 'returns'), 'content').getBoundingClientRect().height).toBeGreaterThan(0);
});

/* The mock DOM never fires `slotchange`, so this is the only place for it. */
test('wires up a section added after mount', async () => {
  const el = await mount(FIXTURE('value="shipping"'));

  const added = document.createElement('pf-accordion-item');
  added.setAttribute('value', 'extras');
  added.innerHTML = '<span slot="title">Extras</span><p>More.</p>';
  el.append(added);
  await until(() => Boolean(added.shadowRoot?.querySelector('[part="trigger"]')), 'upgrade');

  (part(added, 'trigger') as HTMLButtonElement).click();
  await until(() => el.value === 'extras', 'clicking the added header');
  // The group writes `expanded` as a property; the attribute follows on the
  // item's next render, which is a tick or two later.
  await until(() => added.hasAttribute('expanded'), 'the added section opening');
  expect(item(el, 'shipping').hasAttribute('expanded')).toBe(false);
});

/* A property change leaves no attribute and fires no `slotchange`. */
test('re-reads a section disabled through its property', async () => {
  const el = await mount(FIXTURE());

  (item(el, 'returns') as HTMLElement & { disabled: boolean }).disabled = true;
  await el.refresh();
  await until(() => trigger(el, 'returns').disabled, 'the header disabling');

  trigger(el, 'shipping').focus();
  await userEvent.keyboard('{ArrowDown}');
  // Both the other two are disabled now, so the only enabled header is this
  // one and Down has nowhere else to go.
  await frame();
  await frame();
  expect(focusedValue()).toBe('shipping');
});
