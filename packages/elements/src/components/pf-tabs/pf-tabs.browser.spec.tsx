/**
 * What the fast project cannot see: real focus, so the arrows have somewhere
 * to move from; `slotchange`, which the mock DOM never fires; and layout, so
 * the indicator has coordinates to be placed at.
 *
 * Neither project applies `styleUrl` CSS, so the indicator's *painted* box is
 * asserted in `scripts/smoke-consumer.mjs` against a real build. Here the
 * claim is narrower and still worth making: the coordinates written onto it
 * are the selected tab's, measured from the strip.
 */
import { userEvent } from '@vitest/browser/context';
import { afterEach, expect, test } from 'vitest';
import './pf-tabs';
import '../pf-tab/pf-tab';
import '../pf-tab-panel/pf-tab-panel';
import '../pf-icon/pf-icon';
import '../pf-badge/pf-badge';

type Tabs = HTMLElement & { value: string; refresh(): Promise<void> };

const FIXTURE = (attrs = '') => `
  <pf-tabs ${attrs}>
    <pf-tab value="overview">Overview</pf-tab>
    <pf-tab-panel value="overview">Overview content</pf-tab-panel>
    <pf-tab value="details">Details of the thing</pf-tab>
    <pf-tab-panel value="details">Details content</pf-tab-panel>
    <pf-tab value="history" disabled>History</pf-tab>
    <pf-tab-panel value="history">History content</pf-tab-panel>
  </pf-tabs>`;

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-tabs');
  await customElements.whenDefined('pf-tab');
  await customElements.whenDefined('pf-tab-panel');
  await frame();
  await frame();
  return document.querySelector('pf-tabs') as Tabs;
};

/* Stencil's queue is async, so a re-render lands some frames after the event. */
const until = async (predicate: () => boolean, label = 'pf-tabs') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const tab = (el: Tabs, value: string) =>
  el.querySelector(`pf-tab[value="${value}"]`) as HTMLElement;
const panel = (el: Tabs, value: string) =>
  el.querySelector(`pf-tab-panel[value="${value}"]`) as HTMLElement;
const part = (el: Tabs, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const selectedValue = (el: Tabs) =>
  el.querySelector('pf-tab[aria-selected="true"]')?.getAttribute('value') ?? null;
const focusedValue = () => (document.activeElement as HTMLElement)?.getAttribute('value') ?? null;

afterEach(() => {
  document.body.innerHTML = '';
});

test('the arrows move the selection, and the focus with it', async () => {
  const el = await mount(FIXTURE());
  const changes: string[] = [];
  el.addEventListener('pfChange', (event) =>
    changes.push((event as CustomEvent<{ value: string }>).detail.value),
  );

  tab(el, 'overview').focus();
  await userEvent.keyboard('{ArrowRight}');
  await until(() => selectedValue(el) === 'details', 'ArrowRight');

  expect(focusedValue()).toBe('details');
  expect(panel(el, 'details').hasAttribute('hidden')).toBe(false);
  expect(changes).toEqual(['details']);
});

/* History is disabled, so Right from the last enabled tab wraps to the first. */
test('the arrows skip a disabled tab, and wrap at both ends', async () => {
  const el = await mount(FIXTURE('value="details"'));

  tab(el, 'details').focus();
  await userEvent.keyboard('{ArrowRight}');
  await until(() => selectedValue(el) === 'overview', 'wrap forwards');
  expect(focusedValue()).toBe('overview');

  await userEvent.keyboard('{ArrowLeft}');
  await until(() => selectedValue(el) === 'details', 'wrap backwards');
  expect(focusedValue()).toBe('details');
});

test('Home and End jump to the first and last enabled tab', async () => {
  const el = await mount(FIXTURE('value="details"'));

  tab(el, 'details').focus();
  await userEvent.keyboard('{End}');
  // The last tab is disabled, so End stops at the last *enabled* one.
  await until(() => focusedValue() === 'details', 'End');
  expect(selectedValue(el)).toBe('details');

  await userEvent.keyboard('{Home}');
  await until(() => selectedValue(el) === 'overview', 'Home');
  expect(focusedValue()).toBe('overview');
});

test('Enter and Space select the focused tab', async () => {
  const el = await mount(FIXTURE());

  // tabindex is the group's, so reaching a second tab means moving the stop.
  tab(el, 'details').tabIndex = 0;
  tab(el, 'details').focus();
  await userEvent.keyboard('{Enter}');
  await until(() => selectedValue(el) === 'details', 'Enter');

  tab(el, 'overview').tabIndex = 0;
  tab(el, 'overview').focus();
  await userEvent.keyboard(' ');
  await until(() => selectedValue(el) === 'overview', 'Space');
});

test('is one tab stop, which follows the selection', async () => {
  const el = await mount(FIXTURE());

  const stops = () =>
    Array.from(el.querySelectorAll('pf-tab'))
      .filter((node) => node.getAttribute('tabindex') === '0')
      .map((node) => node.getAttribute('value'));
  expect(stops()).toEqual(['overview']);

  tab(el, 'overview').focus();
  await userEvent.keyboard('{ArrowRight}');
  await until(() => selectedValue(el) === 'details', 'ArrowRight');
  expect(stops()).toEqual(['details']);
});

/* Tabbing in from outside lands on the selection, not on the first tab. */
test('tabs in from outside onto the selected tab', async () => {
  document.body.innerHTML = `<button id="before">before</button>${FIXTURE('value="details"')}`;
  await customElements.whenDefined('pf-tabs');
  await frame();
  await frame();
  const el = document.querySelector('pf-tabs') as Tabs;

  (document.getElementById('before') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Tab}');

  expect(document.activeElement).toBe(tab(el, 'details'));
});

test('a disabled tab refuses a click', async () => {
  const el = await mount(FIXTURE());
  const changes: string[] = [];
  el.addEventListener('pfChange', () => changes.push('x'));

  /*
   * Dispatched rather than `userEvent.click`, which refuses the element
   * outright: Playwright's actionability check reads `aria-disabled="true"` as
   * "not enabled" and waits for it to clear until the test times out. The
   * browser has no such scruple — `aria-disabled` is not `pointer-events: none`
   * — so a real click does arrive, and swallowing it is the element's job.
   */
  tab(el, 'history').click();
  await frame();
  await frame();

  expect(selectedValue(el)).toBe('overview');
  expect(changes).toEqual([]);
});

/*
 * The mock DOM never fires `slotchange`, so this is the only place a tab added
 * after mount can be shown to be wired up — and the id wiring is exactly what
 * would be missing.
 */
test('wires up a tab and panel added after mount', async () => {
  const el = await mount(FIXTURE());

  const added = document.createElement('pf-tab');
  added.setAttribute('value', 'files');
  added.textContent = 'Files';
  const addedPanel = document.createElement('pf-tab-panel');
  addedPanel.setAttribute('value', 'files');
  addedPanel.textContent = 'Files content';
  el.append(added, addedPanel);

  await until(() => added.hasAttribute('aria-controls'), 'slotchange wiring');
  expect(added.getAttribute('slot')).toBe('tab');
  expect(added.getAttribute('aria-controls')).toBe(addedPanel.id);
  expect(addedPanel.getAttribute('aria-labelledby')).toBe(added.id);
  expect(addedPanel.hasAttribute('hidden')).toBe(true);

  await userEvent.click(added);
  await until(() => selectedValue(el) === 'files', 'clicking the added tab');
  expect(addedPanel.hasAttribute('hidden')).toBe(false);
});

/*
 * A tab lands in the strip and a panel in the stack however the two are
 * ordered, because `pf-tab` assigns itself. Written interleaved here — one tab
 * and one panel per item — which is what a loop over data produces.
 */
test('sorts interleaved children into the strip and the stack', async () => {
  const el = await mount(FIXTURE());

  const assigned = (name: string) =>
    (
      el.shadowRoot?.querySelector(
        name === 'tab' ? 'slot[name="tab"]' : 'slot:not([name])',
      ) as HTMLSlotElement
    )
      .assignedElements()
      .map((node) => node.tagName.toLowerCase());

  expect(assigned('tab')).toEqual(['pf-tab', 'pf-tab', 'pf-tab']);
  expect(assigned('panel')).toEqual(['pf-tab-panel', 'pf-tab-panel', 'pf-tab-panel']);
});

/*
 * The coordinate-landing assertion. A rect-delta measurement is the only one
 * available: `offsetLeft` on a slotted tab is resolved against an offsetParent
 * in the *document* tree rather than the strip it renders inside, so it cannot
 * place a box that lives in the strip's own coordinates.
 */
test('writes the selected tab’s coordinates onto the indicator', async () => {
  const el = await mount(FIXTURE());
  const list = part(el, 'list');
  const indicator = part(el, 'indicator');

  const expected = (value: string) => {
    const tabRect = tab(el, value).getBoundingClientRect();
    return {
      left: tabRect.left - list.getBoundingClientRect().left + list.scrollLeft,
      width: tabRect.width,
    };
  };

  const first = expected('overview');
  expect(parseFloat(indicator.style.left)).toBeCloseTo(first.left, 1);
  expect(parseFloat(indicator.style.width)).toBeCloseTo(first.width, 1);
  expect(indicator.hasAttribute('hidden')).toBe(false);

  // The two tabs have different labels, so a stale width would show here.
  tab(el, 'overview').focus();
  await userEvent.keyboard('{ArrowRight}');
  await until(() => selectedValue(el) === 'details', 'ArrowRight');
  await until(() => parseFloat(indicator.style.width) !== first.width, 'indicator moved');

  const second = expected('details');
  expect(parseFloat(indicator.style.left)).toBeCloseTo(second.left, 1);
  expect(parseFloat(indicator.style.width)).toBeCloseTo(second.width, 1);
  expect(second.width).not.toBeCloseTo(first.width, 1);
});

/*
 * The indicator is a child of the scrolling strip, so it has to be placed in
 * the strip's scroll coordinates — and both rects move together when it
 * scrolls, which is what `scrollLeft` adds back.
 *
 * The strip is made scrollable with inline styles, since neither test project
 * applies the stylesheet that normally does it.
 */
test('places the indicator in the strip’s scroll coordinates', async () => {
  const el = await mount(FIXTURE('value="details"'));
  const list = part(el, 'list');
  const indicator = part(el, 'indicator');

  Object.assign(list.style, { display: 'flex', overflowX: 'auto', width: '60px' });
  Object.assign(tab(el, 'overview').style, { flex: '0 0 200px' });
  Object.assign(tab(el, 'details').style, { flex: '0 0 200px' });
  await until(() => list.scrollWidth > list.clientWidth, 'a scrollable strip');
  await el.refresh();
  // The second tab starts 200px into the strip, whatever it is scrolled to.
  await until(() => Math.round(parseFloat(indicator.style.left)) === 200, 'the unscrolled offset');

  list.scrollLeft = 120;
  await el.refresh();
  await until(() => Math.round(parseFloat(indicator.style.left)) === 200, 'the scrolled offset');

  // Scrolled, the tab's viewport rect has moved 120px left; the indicator's
  // coordinate did not, because it scrolls with the strip.
  expect(
    tab(el, 'details').getBoundingClientRect().left - list.getBoundingClientRect().left,
  ).toBeCloseTo(80, 0);
});

/* A tab set whose every tab is disabled has nothing to put it under. */
test('hides the indicator when no tab can be selected', async () => {
  const el = await mount(`
    <pf-tabs>
      <pf-tab value="a" disabled>A</pf-tab>
      <pf-tab-panel value="a">A content</pf-tab-panel>
    </pf-tabs>`);

  expect(part(el, 'indicator').hasAttribute('hidden')).toBe(true);
  expect(selectedValue(el)).toBeNull();
  expect(panel(el, 'a').hasAttribute('hidden')).toBe(true);
});

/*
 * Only the pills variant needs a vertical box. The underline's comes from the
 * stylesheet, and an inline `top` left behind by a variant change would
 * outrank it for good.
 */
test('writes a vertical box for pills only', async () => {
  const el = await mount(FIXTURE('variant="pills"'));
  const indicator = part(el, 'indicator');
  expect(indicator.style.height).not.toBe('');

  el.setAttribute('variant', 'underline');
  await until(() => indicator.style.height === '', 'underline clears the height');
  expect(indicator.style.top).toBe('');
  expect(parseFloat(indicator.style.width)).toBeGreaterThan(0);
});

/*
 * A property change leaves no attribute, moves no node and fires no
 * `slotchange`: without `refresh()` nothing here could notice it.
 */
test('re-reads a tab disabled through its property', async () => {
  const el = await mount(FIXTURE());

  (tab(el, 'overview') as HTMLElement & { disabled: boolean }).disabled = true;
  await el.refresh();
  await until(() => selectedValue(el) === 'details', 'refresh');

  expect(tab(el, 'overview').getAttribute('tabindex')).toBe('-1');
  expect(panel(el, 'details').hasAttribute('hidden')).toBe(false);
});
