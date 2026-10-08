/**
 * The one thing the fast project cannot see: `slotchange`. Every optional box
 * here is hidden rather than left out precisely so that content arriving later
 * is noticed, which is only testable in a real DOM.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-metric-card';
import '../pf-metric-grid/pf-metric-grid';
import '../pf-icon/pf-icon';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-metric-card');
  await frame();
  await frame();
  return document.querySelector('pf-metric-card') as HTMLElement;
};

const until = async (predicate: () => boolean, label = 'pf-metric-card') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const part = (el: HTMLElement, name: string) =>
  el.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const empty = (el: HTMLElement, name: string) => part(el, name).classList.contains('empty');

const FIXTURE = `
  <pf-metric-card trend="positive">
    <span slot="heading">Revenue</span>
    £24,500
  </pf-metric-card>`;

afterEach(() => {
  document.body.innerHTML = '';
});

test('notices a trend slotted in after mount', async () => {
  const el = await mount(FIXTURE);
  expect(empty(el, 'trend')).toBe(true);

  const trend = document.createElement('span');
  trend.slot = 'trend';
  trend.textContent = '12% on last month';
  el.append(trend);

  await until(() => !empty(el, 'trend'), 'the trend pill appearing');
  expect(part(el, 'trend').textContent).toContain('+');

  trend.remove();
  await until(() => empty(el, 'trend'), 'the trend pill going');
});

test('notices an icon and an action slotted in after mount', async () => {
  const el = await mount(FIXTURE);
  expect(empty(el, 'icon')).toBe(true);
  expect(empty(el, 'action')).toBe(true);

  const icon = document.createElement('pf-icon');
  icon.slot = 'icon';
  icon.setAttribute('name', 'chart-bar');
  const action = document.createElement('button');
  action.slot = 'action';
  action.textContent = 'Export';
  el.append(icon, action);

  await until(() => !empty(el, 'icon') && !empty(el, 'action'), 'both boxes appearing');
});

/*
 * The description is styled through `::slotted()` and has no box, so there is
 * nothing to collapse: an unassigned slot generates nothing — measured here as
 * a zero box, against the grid's own gap it would otherwise leave behind.
 */
test('a card with no description generates no box for one', async () => {
  await mount(`
    <pf-metric-grid>
      <pf-metric-card id="described">
        <span slot="heading">Revenue</span>
        £24,500
        <span slot="description">Since April</span>
      </pf-metric-card>
      <pf-metric-card id="plain">
        <span slot="heading">Orders</span>
        1,204
      </pf-metric-card>
    </pf-metric-grid>`);

  const slotOf = (id: string) =>
    (document.getElementById(id) as HTMLElement).shadowRoot?.querySelector(
      'slot[name="description"]',
    ) as HTMLSlotElement;

  expect(slotOf('plain').getBoundingClientRect().height).toBe(0);
  expect(getComputedStyle(slotOf('plain')).display).toBe('contents');
  expect(slotOf('described').assignedElements()).toHaveLength(1);
});

/* The cards have to be grid items of the grid, not of a box inside it. */
test('the cards are laid out by the grid itself', async () => {
  await mount(`
    <pf-metric-grid>
      <pf-metric-card><span slot="heading">A</span>1</pf-metric-card>
      <pf-metric-card><span slot="heading">B</span>2</pf-metric-card>
    </pf-metric-grid>`);

  const grid = document.querySelector('pf-metric-grid') as HTMLElement;
  const slot = grid.shadowRoot?.querySelector('slot') as HTMLSlotElement;
  expect(getComputedStyle(slot).display).toBe('contents');
  expect(slot.assignedElements()).toHaveLength(2);
});
