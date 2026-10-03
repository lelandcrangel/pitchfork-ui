/**
 * The grid, the labels and the buckets. The cells' entrance animation needs a
 * real build, so it is in the consumer smoke.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-heatmap';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const cells = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll<HTMLElement>('[part="cell"]') ?? []);
const padding = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll<HTMLElement>('.cell--empty') ?? []);
/*
 * How many padding cells come before the first real day, which is what the
 * week alignment decides. The total number of padding cells cannot show it:
 * the grid is rectangular, so a week moved forward at the start is a week
 * moved back at the end and the two counts cancel out — both alignments of
 * the same range came to seven.
 */
const leadingPadding = (root: HTMLElement) => {
  const children = Array.from(root.shadowRoot?.querySelector('[part="grid"]')?.children ?? []);
  return children.findIndex((cell) => cell.getAttribute('part') === 'cell');
};
const months = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll<HTMLElement>('.month') ?? []).map(
    (node) => node.textContent,
  );
const weekdays = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll<HTMLElement>('.weekday') ?? []).map(
    (node) => node.textContent,
  );

const DATA = JSON.stringify([
  { date: '2024-03-04', value: 1 },
  { date: '2024-03-06', value: 5 },
  { date: '2024-03-10', value: 10 },
]);

describe('pf-heatmap', () => {
  it('is a named image', async () => {
    const { root } = await render(`<pf-heatmap data='${DATA}' label="Commits"></pf-heatmap>`);

    expect(root.getAttribute('role')).toBe('img');
    expect(root.getAttribute('aria-label')).toBe('Commits');
  });

  /* The generated name says the range and the total, which is the summary. */
  it('describes itself when it has no name', async () => {
    const { root } = await render(`<pf-heatmap data='${DATA}'></pf-heatmap>`);
    expect(root.getAttribute('aria-label')).toBe(
      'Activity heatmap from 2024-03-04 to 2024-03-10, 16 total',
    );
  });

  /*
   * Stencil coerces an attribute only for the primitive types it recognises,
   * so an array prop arrives as the string verbatim — read through a getter
   * that parses it.
   */
  it('takes its data from a JSON attribute', async () => {
    const { root } = await render(`<pf-heatmap data='${DATA}'></pf-heatmap>`);
    expect(cells(root)).toHaveLength(7);
  });

  it('shows its empty state for malformed data rather than throwing', async () => {
    const { root } = await render("<pf-heatmap data='not json'></pf-heatmap>");
    expect(part(root, 'empty')?.textContent).toContain('No data');
  });

  it('shows its empty state with nothing to draw', async () => {
    const { root } = await render('<pf-heatmap></pf-heatmap>');

    expect(part(root, 'empty')).toBeTruthy();
    expect(part(root, 'grid')).toBeNull();
  });

  it('takes an empty state of its own', async () => {
    const { root } = await render('<pf-heatmap><span slot="empty">Nothing</span></pf-heatmap>');
    const slot = part(root, 'empty')?.querySelector('slot[name="empty"]');

    expect(slot).toBeTruthy();
    expect(slot?.textContent).toContain('No data');
  });

  it('draws a cell per day in the range, and padding for the rest of the week', async () => {
    const { root } = await render(
      '<pf-heatmap start-date="2024-03-04" end-date="2024-03-10"></pf-heatmap>',
    );

    expect(cells(root)).toHaveLength(7);
    // 2024-03-04 is a Monday, so a Sunday-first grid pads the day before it.
    expect(leadingPadding(root)).toBe(1);
    // And the grid stays rectangular: whole columns of seven throughout.
    expect(cells(root).length + padding(root).length).toBe(14);
  });

  it('aligns the grid to the week start', async () => {
    const sunday = await render(
      '<pf-heatmap start-date="2024-03-06" end-date="2024-03-12" week-starts-on="0"></pf-heatmap>',
    );
    const monday = await render(
      '<pf-heatmap start-date="2024-03-06" end-date="2024-03-12" week-starts-on="1"></pf-heatmap>',
    );

    // Wednesday the 6th is three days into a Sunday week and two into a Monday one.
    expect(leadingPadding(sunday.root)).toBe(3);
    expect(leadingPadding(monday.root)).toBe(2);
  });

  /*
   * A union-literal prop defeats Stencil's coercion: `week-starts-on="1"`
   * arrives as the string `"1"`, so a comparison against the number is false.
   * Read through a getter that coerces.
   */
  it('coerces the week start from its attribute', async () => {
    const { root } = await render(
      '<pf-heatmap start-date="2024-03-06" end-date="2024-03-12" week-starts-on="1"></pf-heatmap>',
    );
    expect(weekdays(root)[1]).toBe('Tue');
  });

  it('labels every other weekday, so three-letter names do not overlap', async () => {
    const { root } = await render(`<pf-heatmap data='${DATA}'></pf-heatmap>`);
    expect(weekdays(root)).toEqual(['', 'Mon', '', 'Wed', '', 'Fri', '']);
  });

  it('names each month at the column it starts in', async () => {
    const { root } = await render(
      '<pf-heatmap start-date="2024-02-26" end-date="2024-04-07" week-starts-on="1"></pf-heatmap>',
    );
    expect(months(root)).toEqual(['Feb', 'Mar', 'Apr']);
  });

  it('drops the labels when asked', async () => {
    const { root } = await render(
      `<pf-heatmap data='${DATA}' show-weekday-labels="false" show-month-labels="false"></pf-heatmap>`,
    );

    expect(part(root, 'weekdays')).toBeNull();
    expect(part(root, 'months')).toBeNull();
    expect(part(root, 'grid')).toBeTruthy();
  });

  /* A day with one commit must not look like a day with none. */
  it('buckets the values, with any positive value above empty', async () => {
    const { root } = await render(`<pf-heatmap data='${DATA}'></pf-heatmap>`);
    const levels = cells(root).map((cell) => cell.getAttribute('data-level'));

    expect(levels).toContain('0');
    expect(levels).toContain('1');
    expect(levels).toContain('4');
  });

  /*
   * Fewer than two buckets is not a scale, and a `levels` that is not a
   * number would divide by `NaN` and put `color-mix(… NaN%)` on every cell.
   */
  it('keeps at least two buckets whatever it is given', async () => {
    for (const levels of ['1', '0', 'lots']) {
      const { root } = await render(`<pf-heatmap data='${DATA}' levels="${levels}"></pf-heatmap>`);
      const styles = cells(root).map((cell) => cell.getAttribute('style') ?? '');
      const buckets = cells(root).map((cell) => cell.getAttribute('data-level'));

      expect(styles.every((style) => !style.includes('NaN'))).toBe(true);
      expect(new Set(buckets)).toEqual(new Set(['0', '1']));
    }
  });

  it('mixes the cell colour from the heatmap aliases', async () => {
    const { root } = await render(`<pf-heatmap data='${DATA}'></pf-heatmap>`);
    const styles = cells(root).map((cell) => cell.getAttribute('style') ?? '');

    expect(styles.some((style) => style.includes('color-mix'))).toBe(true);
    expect(styles.every((style) => !style.includes('NaN'))).toBe(true);
  });

  /*
   * `Math.max(max, value)` and `sum + value` each carry one NaN through
   * everything: every level came out NaN and the summary read "NaN total".
   */
  it('draws the rest when one value is not a number', async () => {
    const { root } = await render(
      `<pf-heatmap data='${JSON.stringify([
        { date: '2024-03-04', value: null },
        { date: '2024-03-05', value: 4 },
      ])}'></pf-heatmap>`,
    );

    expect(root.getAttribute('aria-label')).toContain('4 total');
    expect(root.getAttribute('aria-label')).not.toMatch(/NaN/);
    expect(cells(root).every((cell) => cell.getAttribute('data-level') !== 'NaN')).toBe(true);
  });

  it('titles each cell with its date and value', async () => {
    const { root } = await render(`<pf-heatmap data='${DATA}'></pf-heatmap>`);
    const titles = cells(root).map((cell) => cell.getAttribute('title'));

    expect(titles).toContain('2024-03-04: 1');
    expect(titles).toContain('2024-03-05: 0');
  });

  it('passes the cell size and gap down as custom properties', async () => {
    const { root } = await render(
      `<pf-heatmap data='${DATA}' cell-size="20" cell-gap="5"></pf-heatmap>`,
    );
    const style = root.getAttribute('style') ?? '';

    expect(style).toContain('--pf-heatmap-cell-size: 20px');
    expect(style).toContain('--pf-heatmap-cell-gap: 5px');
  });

  /* `new Date('2024-02-31')` rolls forward; the parse refuses it. */
  it('refuses a date that is not one', async () => {
    const { root } = await render(
      `<pf-heatmap data='${JSON.stringify([{ date: '2024-02-31', value: 1 }])}'></pf-heatmap>`,
    );
    expect(part(root, 'empty')).toBeTruthy();
  });

  /*
   * The cells are staggered by column, so the grid wipes in oldest first
   * rather than all at once.
   */
  it('staggers the cells by column', async () => {
    const { root } = await render(
      '<pf-heatmap start-date="2024-03-04" end-date="2024-03-20"></pf-heatmap>',
    );
    const delays = cells(root).map(
      (cell) => (cell.getAttribute('style') ?? '').match(/animation-delay:\s*(\d+)ms/)?.[1],
    );

    expect(delays[0]).toBe('0');
    expect(new Set(delays).size).toBeGreaterThan(1);
  });
});
