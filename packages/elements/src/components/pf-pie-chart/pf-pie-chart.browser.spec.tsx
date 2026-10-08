/**
 * `slotchange`, which the mock DOM never fires, and the slot fallbacks, whose
 * overrides it cannot see either: a slot's `textContent` there reports the
 * fallback whether or not anything was assigned.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-pie-chart';
import '../pf-pie-slice/pf-pie-slice';

type Chart = HTMLElement & { refresh(): Promise<void>; cutout: number };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-pie-chart');
  await customElements.whenDefined('pf-pie-slice');
  await frame();
  await frame();
  return document.querySelector('pf-pie-chart') as Chart;
};

const until = async (predicate: () => boolean, label = 'pf-pie-chart') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (host: Element, name: string) =>
  host.shadowRoot!.querySelector(`[part='${name}']`) as HTMLElement;
const slices = (el: Chart) => Array.from(el.querySelectorAll('pf-pie-slice'));
const shares = (el: Chart) =>
  slices(el).map((slice) => (slice as HTMLElement & { share: number }).share);
const assignedText = (host: Element, name: string) =>
  (part(host, 'center').querySelector(`slot[name='${name}']`) as HTMLSlotElement | null)
    ?.assignedNodes()
    .map((node) => node.textContent)
    .join('')
    .trim() ?? null;

afterEach(() => {
  document.body.innerHTML = '';
});

const FIXTURE = `
  <pf-pie-chart>
    <pf-pie-slice value="1">Direct</pf-pie-slice>
    <pf-pie-slice value="3">Search</pf-pie-slice>
  </pf-pie-chart>`;

test('a slice appended later is shared in with the rest', async () => {
  const el = await mount(FIXTURE);
  expect(shares(el)).toEqual([25, 75]);

  const added = document.createElement('pf-pie-slice');
  added.setAttribute('value', '4');
  added.textContent = 'Social';
  el.appendChild(added);

  await until(
    () => shares(el).join() === '12.5,37.5,50'.replace(/\.\d/g, '') || shares(el).length === 3,
    'the new slice',
  );
  await until(() => shares(el).reduce((sum, value) => sum + value, 0) === 100, 'the new total');
  expect(shares(el)).toEqual([13, 37, 50]);
});

test('removing a slice shares the total out again', async () => {
  const el = await mount(FIXTURE);

  slices(el)[0].remove();
  await until(() => slices(el).length === 1, 'the removal');
  await until(() => shares(el)[0] === 100, 'the new total');
});

/* The overrides, which the fast project cannot see through a slot. */
test('a consumer’s own centre and empty states replace the fallbacks', async () => {
  const withCentre = await mount(`
    <pf-pie-chart>
      <span slot="center">4k</span>
      <pf-pie-slice value="4">Search</pf-pie-slice>
    </pf-pie-chart>`);
  expect(assignedText(withCentre, 'center')).toBe('4k');

  document.body.innerHTML = '';
  const empty = await mount(`
    <pf-pie-chart>
      <span slot="empty">Nothing yet</span>
      <pf-pie-slice value="0">Shown</pf-pie-slice>
    </pf-pie-chart>`);
  expect(assignedText(empty, 'empty')).toBe('Nothing yet');
});

/*
 * The slice's label is its own slotted content, which is the whole reason the
 * legend is made of slices rather than built in the chart's shadow root.
 */
test('each legend row carries its own label and share', async () => {
  const el = await mount(FIXTURE);
  const [first, second] = slices(el);

  const labelOf = (slice: Element) =>
    (part(slice, 'label').querySelector('slot') as HTMLSlotElement)
      .assignedNodes()
      .map((node) => node.textContent)
      .join('')
      .trim();

  expect(labelOf(first)).toBe('Direct');
  expect(labelOf(second)).toBe('Search');
  expect(part(first, 'value').textContent).toBe('25%');
  expect(part(second, 'value').textContent).toBe('75%');
});

/* A slice the chart did not draw is not a legend row either. */
test('a slice of zero is hidden from the legend', async () => {
  const el = await mount(`
    <pf-pie-chart>
      <pf-pie-slice value="3">Shown</pf-pie-slice>
      <pf-pie-slice value="0">Empty</pf-pie-slice>
    </pf-pie-chart>`);

  await until(() => slices(el)[0].hasAttribute('drawn'), 'the drawn slice');
  expect(slices(el)[1].hasAttribute('drawn')).toBe(false);
});

/*
 * The gradient's own `background-image` is **not** asserted here: the
 * declaration that reads `var(--pf-pie-gradient)` lives in the stylesheet,
 * and neither test project applies `styleUrl` CSS, so the computed value is
 * `none` whatever the property holds. The inline property is checked in the
 * fast spec and the painted result in `scripts/smoke-consumer.mjs`.
 */

/* Changing the cutout re-sizes the hole without touching the slices. */
test('the hole follows the cutout', async () => {
  const el = await mount(FIXTURE);
  const hole = () => part(el, 'center').getBoundingClientRect().width;
  const before = hole();

  el.cutout = 0.2;
  await until(() => hole() < before, 'the smaller hole');
  expect(shares(el)).toEqual([25, 75]);
});
