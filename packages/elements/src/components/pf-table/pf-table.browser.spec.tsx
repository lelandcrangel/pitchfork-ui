/**
 * `slotchange` and real layout: the CSS-table arrangement is the reason this
 * element exists in the shape it does, and the one thing worth measuring here
 * is that a row is a box at all. The colours, the striping and the sticky
 * header need the stylesheet, so they are in `scripts/smoke-consumer.mjs`.
 */
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test } from 'vitest';
import './pf-table';
import '../pf-table-row/pf-table-row';
import '../pf-table-cell/pf-table-cell';

type Table = HTMLElement & {
  sortKey?: string;
  sortDirection: string;
  refresh(): Promise<void>;
};

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const FIXTURE = `
  <pf-table>
    <span slot="caption">Orders</span>
    <pf-table-row head>
      <pf-table-cell sortable sort-key="name">Name</pf-table-cell>
      <pf-table-cell sortable sort-key="total" align="right">Total</pf-table-cell>
    </pf-table-row>
    <pf-table-row>
      <pf-table-cell>Ada</pf-table-cell>
      <pf-table-cell align="right">£24.00</pf-table-cell>
    </pf-table-row>
    <pf-table-row>
      <pf-table-cell>Grace</pf-table-cell>
      <pf-table-cell align="right">£18.00</pf-table-cell>
    </pf-table-row>
  </pf-table>`;

const mount = async (html: string) => {
  document.body.innerHTML = html;
  await customElements.whenDefined('pf-table');
  await customElements.whenDefined('pf-table-row');
  await customElements.whenDefined('pf-table-cell');
  await frame();
  await frame();
  return document.querySelector('pf-table') as Table;
};

const until = async (predicate: () => boolean, label = 'pf-table') => {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await frame();
  }
};

const rows = (el: Table) =>
  Array.from(el.querySelectorAll('pf-table-row')).filter((row) => row.parentElement === el);
const headCells = (el: Table) =>
  Array.from(el.querySelectorAll('pf-table-row[head] pf-table-cell'));
const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The whole reason the layout is CSS tables rather than a grid: a grid needs
 * its rows to be `display: contents` for the cells to line up in columns, and
 * an element with no box takes no background and no `:hover`. Measured here,
 * with the stylesheet declared inline since neither project applies it.
 */
test('a row is a box, so it can be striped and hovered', async () => {
  const el = await mount(FIXTURE);
  const style = document.createElement('style');
  style.textContent = `
    pf-table::part(table) { display: table }
    pf-table-row { display: table-row }
    pf-table-cell { display: table-cell }`;
  document.head.append(style);
  await frame();

  const [, first, second] = rows(el);
  expect(getComputedStyle(first).display).toBe('table-row');
  // A row with a box has a size of its own; a `display: contents` one does not.
  expect(first.getBoundingClientRect().height).toBeGreaterThan(0);
  expect(first.getBoundingClientRect().width).toBeGreaterThan(0);
  // And the two rows are stacked, which is what the column alignment needs.
  expect(second.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().top);

  style.remove();
});

/* Both kinds of slotted content, read the way assignment actually works. */
test('slots the caption and the rows where they belong', async () => {
  const el = await mount(FIXTURE);

  const slot = (name?: string) =>
    el.shadowRoot?.querySelector(
      name ? `slot[name="${name}"]` : 'slot:not([name])',
    ) as HTMLSlotElement;

  expect(
    slot('caption')
      .assignedElements()
      .map((node) => node.textContent),
  ).toEqual(['Orders']);
  expect(slot().assignedElements()).toHaveLength(3);
});

test('the header buttons are tab stops, and Enter sorts', async () => {
  const el = await mount(FIXTURE);
  const sorts: Array<{ key: string; direction: string }> = [];
  el.addEventListener('pfSortChange', (event) =>
    sorts.push((event as CustomEvent<{ key: string; direction: string }>).detail),
  );

  (part(headCells(el)[0], 'sort') as HTMLButtonElement).focus();
  await userEvent.keyboard('{Enter}');
  await until(() => el.sortKey === 'name', 'Enter sorting');

  // Tab reaches the next column's button rather than leaving the table.
  await userEvent.keyboard('{Tab}');
  expect(
    (document.activeElement as HTMLElement)?.shadowRoot?.activeElement?.getAttribute('part'),
  ).toBe('sort');

  await userEvent.keyboard(' ');
  await until(() => el.sortKey === 'total', 'Space sorting');
  expect(sorts).toEqual([
    { key: 'name', direction: 'asc' },
    { key: 'total', direction: 'asc' },
  ]);
});

/*
 * The mock DOM never fires `slotchange`, so this is the only place a row added
 * after mount can be shown to be counted — and the striping and the last-row
 * rule are exactly what would be stale.
 */
test('re-reads the rows when one is appended', async () => {
  const el = await mount(FIXTURE);
  const second = rows(el)[2];
  expect(second.hasAttribute('last')).toBe(true);

  const added = document.createElement('pf-table-row');
  added.innerHTML = '<pf-table-cell>Alan</pf-table-cell><pf-table-cell>£9.00</pf-table-cell>';
  el.append(added);

  await until(() => added.hasAttribute('last'), 'the new row becoming last');
  // The old last row's attribute goes on its own next render, a frame later.
  await until(() => !second.hasAttribute('last'), 'the old last row giving it up');
  expect(added.hasAttribute('odd')).toBe(false);
  // Its cells were told what they are by the row they landed in.
  expect(
    Array.from(added.querySelectorAll('pf-table-cell')).every((cell) => cell.hasAttribute('last')),
  ).toBe(true);
});

test('shows the empty state when the last row goes', async () => {
  const el = await mount(FIXTURE);
  expect(part(el, 'empty')).toBeFalsy();

  for (const row of rows(el).filter((candidate) => !candidate.hasAttribute('head'))) {
    row.remove();
  }

  await until(() => Boolean(part(el, 'empty')), 'the empty state');
  expect(part(el, 'empty').getAttribute('role')).toBe('row');
});
