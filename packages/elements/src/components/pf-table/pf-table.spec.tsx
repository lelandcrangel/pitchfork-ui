/**
 * The markup, the roles and the pushed-down state. The layout — CSS tables,
 * striping, hover, the sticky header — is asserted against a real build in
 * `scripts/smoke-consumer.mjs`, and `slotchange` is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-table';
import '../pf-table-row/pf-table-row';
import '../pf-table-cell/pf-table-cell';

const FIXTURE = (attrs = '', rows = 2) => `
  <pf-table ${attrs}>
    <pf-table-row head>
      <pf-table-cell sortable sort-key="name">Name</pf-table-cell>
      <pf-table-cell sortable sort-key="total" align="right" width="120px">Total</pf-table-cell>
      <pf-table-cell>Notes</pf-table-cell>
    </pf-table-row>
    ${Array.from(
      { length: rows },
      (_, index) => `
    <pf-table-row>
      <pf-table-cell>Row ${index + 1}</pf-table-cell>
      <pf-table-cell align="right">£${index + 1}.00</pf-table-cell>
      <pf-table-cell>—</pf-table-cell>
    </pf-table-row>`,
    ).join('')}
  </pf-table>`;

const rows = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('pf-table-row')).filter((row) => row.parentElement === root);
const headCells = (root: HTMLElement) =>
  Array.from(root.querySelectorAll('pf-table-row[head] pf-table-cell'));
const bodyRows = (root: HTMLElement) => rows(root).filter((row) => !row.hasAttribute('head'));
const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

describe('pf-table', () => {
  it('is a table of rows and cells', async () => {
    const { root } = await render(FIXTURE());

    expect(part(root, 'table')?.getAttribute('role')).toBe('table');
    expect(rows(root).every((row) => row.getAttribute('role') === 'row')).toBe(true);
    expect(headCells(root).every((cell) => cell.getAttribute('role') === 'columnheader')).toBe(
      true,
    );
    expect(
      Array.from(bodyRows(root)[0].querySelectorAll('pf-table-cell')).every(
        (cell) => cell.getAttribute('role') === 'cell',
      ),
    ).toBe(true);
  });

  /* The row knows what it is; its cells do not, so it tells them. */
  it('pushes head onto the header row’s cells', async () => {
    const { root } = await render(FIXTURE());

    expect(headCells(root).every((cell) => cell.hasAttribute('head'))).toBe(true);
    expect(
      Array.from(bodyRows(root)[0].querySelectorAll('pf-table-cell')).some((cell) =>
        cell.hasAttribute('head'),
      ),
    ).toBe(false);
  });

  it('stripes every other body row, counting from the first', async () => {
    const { root } = await render(FIXTURE('striped', 4));

    expect(bodyRows(root).map((row) => row.hasAttribute('odd'))).toEqual([
      false,
      true,
      false,
      true,
    ]);
  });

  /* The table's own border is the rule under the last row. */
  it('drops the last body row’s bottom rule', async () => {
    const { root } = await render(FIXTURE('', 3));
    const last = bodyRows(root)[2];

    expect(last.hasAttribute('last')).toBe(true);
    expect(
      Array.from(last.querySelectorAll('pf-table-cell')).every((cell) => cell.hasAttribute('last')),
    ).toBe(true);
    expect(bodyRows(root)[0].hasAttribute('last')).toBe(false);
  });

  it('starts with nothing sorted', async () => {
    const { root } = await render(FIXTURE());

    expect(headCells(root).map((cell) => cell.getAttribute('aria-sort'))).toEqual([
      'none',
      'none',
      null,
    ]);
  });

  /*
   * Core's rule: a new column starts ascending, the current one turns round.
   * The table reports the sort and leaves the rows alone — they are the
   * consumer's, and reordering their DOM would fight their framework.
   */
  it('reports a sort rather than performing one', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const sorts: Array<{ key: string; direction: string }> = [];
    root.addEventListener('pfSortChange', (event) =>
      sorts.push((event as CustomEvent<{ key: string; direction: string }>).detail),
    );
    const before = bodyRows(root).map((row) => row.textContent?.trim());

    (part(headCells(root)[0], 'sort') as HTMLButtonElement).click();
    await waitForChanges();
    expect(headCells(root)[0].getAttribute('aria-sort')).toBe('ascending');

    (part(headCells(root)[0], 'sort') as HTMLButtonElement).click();
    await waitForChanges();
    expect(headCells(root)[0].getAttribute('aria-sort')).toBe('descending');

    (part(headCells(root)[1], 'sort') as HTMLButtonElement).click();
    await waitForChanges();
    expect(headCells(root)[1].getAttribute('aria-sort')).toBe('ascending');
    // The first column goes back to unsorted, so only one column claims it.
    expect(headCells(root)[0].getAttribute('aria-sort')).toBe('none');

    expect(sorts).toEqual([
      { key: 'name', direction: 'asc' },
      { key: 'name', direction: 'desc' },
      { key: 'total', direction: 'asc' },
    ]);
    // The rows are exactly where the consumer put them.
    expect(bodyRows(root).map((row) => row.textContent?.trim())).toEqual(before);
  });

  it('takes a sort state it is given', async () => {
    const { root } = await render(FIXTURE('sort-key="total" sort-direction="desc"'));

    expect(headCells(root).map((cell) => cell.getAttribute('aria-sort'))).toEqual([
      'none',
      'descending',
      null,
    ]);
  });

  it('offers no button on a column that is not sortable', async () => {
    const { root } = await render(FIXTURE());

    expect(part(headCells(root)[2], 'sort')).toBeNull();
    expect(headCells(root)[2].getAttribute('aria-sort')).toBeNull();
  });

  it('shows the empty state only when there are no body rows', async () => {
    const { root: filled } = await render(FIXTURE());
    expect(part(filled, 'empty')).toBeNull();

    const { root: bare } = await render(FIXTURE('', 0));
    expect(part(bare, 'empty')?.textContent).toContain('No data available.');
    expect(part(bare, 'empty')?.getAttribute('role')).toBe('row');
  });

  /*
   * `textContent` on the shadow box reports the slot's *fallback*, not what
   * was slotted into it — assignment is not what `textContent` walks, in
   * either DOM. So the box being drawn is what is asserted here, and the
   * browser spec reads `assignedElements()` for the content itself.
   */
  it('draws the empty box for a consumer’s own message', async () => {
    const { root } = await render(`
      <pf-table>
        <pf-table-row head><pf-table-cell>Name</pf-table-cell></pf-table-row>
        <span slot="empty">Nothing to show yet.</span>
      </pf-table>`);

    expect(part(root, 'empty')).not.toBeNull();
    expect(root.shadowRoot?.querySelector('slot[name="empty"]')).not.toBeNull();
  });

  /*
   * The caption's box is hidden when nothing is slotted into it: `:has(slot)`
   * would always match, since the slot is itself a child.
   */
  it('hides the caption box until something is slotted into it', async () => {
    const { root: bare } = await render(FIXTURE());
    expect(part(bare, 'caption')?.classList.contains('empty')).toBe(true);

    const { root: captioned } = await render(`
      <pf-table>
        <span slot="caption">Orders</span>
        <pf-table-row head><pf-table-cell>Name</pf-table-cell></pf-table-row>
        <pf-table-row><pf-table-cell>Ada</pf-table-cell></pf-table-row>
      </pf-table>`);
    expect(part(captioned, 'caption')?.classList.contains('empty')).toBe(false);
  });

  it('takes a name for the table itself', async () => {
    const { root } = await render(FIXTURE('label="Orders"'));
    expect(part(root, 'table')?.getAttribute('aria-label')).toBe('Orders');
  });

  it('sets a column width from the header cell', async () => {
    const { root } = await render(FIXTURE());
    expect(headCells(root)[1].getAttribute('style')).toContain('120px');
  });

  it('re-reads the rows on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE('', 2));

    bodyRows(root)[1].remove();
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(bodyRows(root)[0].hasAttribute('last')).toBe(true);
  });

  it('leaves a nested table its own rows', async () => {
    const { root } = await render(`
      <pf-table striped>
        <pf-table-row head><pf-table-cell>Name</pf-table-cell></pf-table-row>
        <pf-table-row>
          <pf-table-cell>
            <pf-table>
              <pf-table-row head><pf-table-cell>Inner</pf-table-cell></pf-table-row>
              <pf-table-row><pf-table-cell>A</pf-table-cell></pf-table-row>
              <pf-table-row><pf-table-cell>B</pf-table-cell></pf-table-row>
            </pf-table>
          </pf-table-cell>
        </pf-table-row>
      </pf-table>`);

    const inner = root.querySelector('pf-table') as HTMLElement;
    const innerBody = bodyRows(inner);
    // The inner table striped its own second row; the outer one did not see it.
    expect(innerBody.map((row) => row.hasAttribute('odd'))).toEqual([false, true]);
    expect(bodyRows(root)).toHaveLength(1);
  });
});
