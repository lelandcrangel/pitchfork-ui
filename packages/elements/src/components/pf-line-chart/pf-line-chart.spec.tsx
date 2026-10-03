/**
 * Both chart types: the scales, the paths and the legend the series make up.
 * The hover-only dots and the layout need a real build, so they are in the
 * consumer smoke.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-line-chart';
import '../pf-bar-chart/pf-bar-chart';
import '../pf-chart-series/pf-chart-series';

const DATA = JSON.stringify([
  { label: 'Jan', visits: 10, signups: 4 },
  { label: 'Feb', visits: 30, signups: 8 },
  { label: 'Mar', visits: 20, signups: 6 },
]);

const SERIES = `
  <pf-chart-series series-key="visits">Visits</pf-chart-series>
  <pf-chart-series series-key="signups">Signups</pf-chart-series>
`;

const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as (SVGElement & HTMLElement) | null;
const parts = (host: Element, name: string) =>
  Array.from(host.shadowRoot?.querySelectorAll(`[part="${name}"]`) ?? []);
const yTicks = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('.tick--y') ?? []).map((node) => node.textContent);
const xTicks = (root: HTMLElement) =>
  Array.from(root.shadowRoot?.querySelectorAll('.tick--x') ?? []).map((node) => node.textContent);
const series = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-chart-series'));

describe('pf-line-chart', () => {
  it('is a named image with a legend of its series', async () => {
    const { root } = await render(
      `<pf-line-chart data='${DATA}' label="Growth">${SERIES}</pf-line-chart>`,
    );

    expect(part(root, 'svg')?.getAttribute('role')).toBe('img');
    expect(part(root, 'svg')?.getAttribute('aria-label')).toBe('Growth');
    expect(part(root, 'legend')?.tagName.toLowerCase()).toBe('ul');
    expect(series(root).every((item) => item.getAttribute('role') === 'listitem')).toBe(true);
  });

  it('falls back to the y-axis label for its name', async () => {
    const { root } = await render(
      `<pf-line-chart data='${DATA}' y-axis-label="Visits">${SERIES}</pf-line-chart>`,
    );
    expect(part(root, 'svg')?.getAttribute('aria-label')).toBe('Visits');
  });

  it('draws a gridline and a label per tick', async () => {
    const { root } = await render(`<pf-line-chart data='${DATA}'>${SERIES}</pf-line-chart>`);

    expect(yTicks(root)).toEqual(['0', '10', '20', '30']);
    expect(parts(root, 'grid')).toHaveLength(4);
  });

  it('labels every row when they fit', async () => {
    const { root } = await render(`<pf-line-chart data='${DATA}'>${SERIES}</pf-line-chart>`);
    expect(xTicks(root)).toEqual(['Jan', 'Feb', 'Mar']);
  });

  it('draws a line and a dot per point for each series', async () => {
    const { root } = await render(`<pf-line-chart data='${DATA}'>${SERIES}</pf-line-chart>`);

    expect(parts(root, 'line')).toHaveLength(2);
    expect(parts(root, 'dot')).toHaveLength(6);
    expect(parts(root, 'area')).toHaveLength(0);
  });

  it('fills under each line on the area variant', async () => {
    const { root } = await render(`<pf-line-chart data='${DATA}' area>${SERIES}</pf-line-chart>`);
    const areas = parts(root, 'area');

    expect(areas).toHaveLength(2);
    expect(areas[0].getAttribute('d')?.endsWith('Z')).toBe(true);
  });

  it('curves by default and joins straight when asked', async () => {
    const curved = await render(`<pf-line-chart data='${DATA}'>${SERIES}</pf-line-chart>`);
    const straight = await render(
      `<pf-line-chart data='${DATA}' curved="false">${SERIES}</pf-line-chart>`,
    );

    expect(part(curved.root, 'line')?.getAttribute('d')).toContain('C ');
    expect(part(straight.root, 'line')?.getAttribute('d')).not.toContain('C ');
    expect(part(straight.root, 'line')?.getAttribute('d')).toContain('L ');
  });

  it('gives each series a palette colour in order, and a given one over it', async () => {
    const { root } = await render(
      `<pf-line-chart data='${DATA}'>
         <pf-chart-series series-key="visits">Visits</pf-chart-series>
         <pf-chart-series series-key="signups" color="tomato">Signups</pf-chart-series>
       </pf-line-chart>`,
    );
    const swatches = series(root).map((item) => (item as HTMLElement & { swatch: string }).swatch);

    expect(swatches[0]).toBe('var(--pf-chart-color-1)');
    expect(swatches[1]).toBe('tomato');
    expect(parts(root, 'line')[1].getAttribute('stroke')).toBe('tomato');
  });

  it('dashes a series that asked for it', async () => {
    const { root } = await render(
      `<pf-line-chart data='${DATA}'>
         <pf-chart-series series-key="visits">Visits</pf-chart-series>
         <pf-chart-series series-key="signups" dashed>Signups</pf-chart-series>
       </pf-line-chart>`,
    );

    expect(parts(root, 'line')[0].hasAttribute('stroke-dasharray')).toBe(false);
    expect(parts(root, 'line')[1].getAttribute('stroke-dasharray')).toBe('6 4');
  });

  /*
   * The axis labels and the geometry come from the same tick scale: a value
   * at the top tick sits on the plot's ceiling.
   */
  it('puts the top of the scale on the plot ceiling', async () => {
    const { root } = await render(
      `<pf-line-chart data='${JSON.stringify([
        { label: 'a', v: 0 },
        { label: 'b', v: 30 },
      ])}'><pf-chart-series series-key="v">V</pf-chart-series></pf-line-chart>`,
    );
    const dots = parts(root, 'dot');

    // padding top 24, plot height 176, so the floor is 200 and the ceiling 24.
    expect(dots[0].getAttribute('cy')).toBe('200');
    expect(dots[1].getAttribute('cy')).toBe('24');
  });

  it('shows its empty state with no rows or no series', async () => {
    const noRows = await render(`<pf-line-chart>${SERIES}</pf-line-chart>`);
    const noSeries = await render(`<pf-line-chart data='${DATA}'></pf-line-chart>`);

    expect(part(noRows.root, 'empty')?.textContent).toContain('No data');
    expect(part(noSeries.root, 'empty')?.textContent).toContain('No data');
    expect(part(noRows.root, 'svg')).toBeNull();
  });

  it('keeps the series slotted in its empty state', async () => {
    const { root } = await render(`<pf-line-chart>${SERIES}</pf-line-chart>`);
    expect(part(root, 'legend')?.querySelector('slot')).toBeTruthy();
  });

  it('shows its empty state for malformed data rather than throwing', async () => {
    const { root } = await render(`<pf-line-chart data='nope'>${SERIES}</pf-line-chart>`);
    expect(part(root, 'empty')).toBeTruthy();
  });

  /*
   * A maximum that is not a number used to make the tick array empty, after
   * which every coordinate came out NaN.
   */
  it('draws a usable chart when a value is not a number', async () => {
    const { root } = await render(
      `<pf-line-chart data='${JSON.stringify([
        { label: 'a', v: 'oops' },
        { label: 'b', v: 'nope' },
      ])}'><pf-chart-series series-key="v">V</pf-chart-series></pf-line-chart>`,
    );

    expect(yTicks(root).length).toBeGreaterThan(1);
    expect(yTicks(root).join()).not.toMatch(/NaN|undefined/);
    expect(part(root, 'line')?.getAttribute('d')).not.toMatch(/NaN|undefined/);
  });

  it('hides the legend for a single series, and when asked', async () => {
    const one = await render(
      `<pf-line-chart data='${DATA}'><pf-chart-series series-key="visits">V</pf-chart-series></pf-line-chart>`,
    );
    const hidden = await render(
      `<pf-line-chart data='${DATA}' show-legend="false">${SERIES}</pf-line-chart>`,
    );

    expect(part(one.root, 'legend')?.className).toContain('legend--hidden');
    expect(part(hidden.root, 'legend')?.className).toContain('legend--hidden');
  });

  it('names each legend row, falling back to the series key', async () => {
    const { root } = await render(
      `<pf-line-chart data='${DATA}'>
         <pf-chart-series series-key="visits">Visits</pf-chart-series>
         <pf-chart-series series-key="signups"></pf-chart-series>
       </pf-line-chart>`,
    );

    expect(part(series(root)[1], 'label')?.querySelector('slot')?.textContent).toContain('signups');
  });

  /* A nested chart owns its own series. */
  it('ignores the series of a chart nested inside it', async () => {
    const { root } = await render(`
      <pf-line-chart data='${DATA}'>
        <pf-chart-series series-key="visits">Visits</pf-chart-series>
        <div>
          <pf-line-chart data='${DATA}'>
            <pf-chart-series series-key="signups">Signups</pf-chart-series>
          </pf-line-chart>
        </div>
      </pf-line-chart>`);

    expect(parts(root, 'line')).toHaveLength(1);
  });
});

describe('pf-bar-chart', () => {
  it('draws a bar per series per group', async () => {
    const { root } = await render(`<pf-bar-chart data='${DATA}'>${SERIES}</pf-bar-chart>`);
    expect(parts(root, 'bar')).toHaveLength(6);
  });

  it('stands the bars of a group side by side', async () => {
    const { root } = await render(`<pf-bar-chart data='${DATA}'>${SERIES}</pf-bar-chart>`);
    const bars = parts(root, 'bar');
    const x = (index: number) => Number(bars[index].getAttribute('x'));

    expect(x(1)).toBeGreaterThan(x(0));
    // And both sit on the plot's floor.
    const floorOf = (index: number) =>
      Number(bars[index].getAttribute('y')) + Number(bars[index].getAttribute('height'));
    expect(floorOf(0)).toBeCloseTo(200, 6);
    expect(floorOf(1)).toBeCloseTo(200, 6);
  });

  it('stacks them when asked', async () => {
    const { root } = await render(`<pf-bar-chart data='${DATA}' stacked>${SERIES}</pf-bar-chart>`);
    const bars = parts(root, 'bar');

    expect(bars[0].getAttribute('x')).toBe(bars[1].getAttribute('x'));
    // The second sits on top of the first.
    expect(Number(bars[1].getAttribute('y'))).toBeLessThan(Number(bars[0].getAttribute('y')));
  });

  /*
   * A stacked chart's scale is the tallest *stack*: scaling to the tallest
   * single bar would draw the top of the stack above the plot.
   */
  it('scales a stacked chart to the tallest stack', async () => {
    const grouped = await render(`<pf-bar-chart data='${DATA}'>${SERIES}</pf-bar-chart>`);
    const stacked = await render(`<pf-bar-chart data='${DATA}' stacked>${SERIES}</pf-bar-chart>`);

    expect(yTicks(grouped.root).at(-1)).toBe('30');
    expect(Number(yTicks(stacked.root).at(-1))).toBeGreaterThanOrEqual(38);
  });

  it('never gives a bar a negative width', async () => {
    const many = Array.from(
      { length: 20 },
      (_, index) => `<pf-chart-series series-key="s${index}">S${index}</pf-chart-series>`,
    ).join('');
    const rows = Array.from({ length: 6 }, (_, group) => {
      const row: Record<string, string | number> = { label: `g${group}` };
      for (let index = 0; index < 20; index += 1) row[`s${index}`] = 5;
      return row;
    });

    const { root } = await render(
      `<pf-bar-chart data='${JSON.stringify(rows)}'>${many}</pf-bar-chart>`,
    );
    const widths = parts(root, 'bar').map((bar) => Number(bar.getAttribute('width')));

    expect(widths).toHaveLength(120);
    expect(widths.every((width) => width > 0)).toBe(true);
  });

  it('puts each x label at its group’s centre', async () => {
    const { root } = await render(`<pf-bar-chart data='${DATA}'>${SERIES}</pf-bar-chart>`);
    const labels = Array.from(root.shadowRoot?.querySelectorAll('.tick--x') ?? []);
    const bars = parts(root, 'bar');

    const firstGroupLeft = Number(bars[0].getAttribute('x'));
    expect(Number(labels[0].getAttribute('x'))).toBeGreaterThan(firstGroupLeft);
  });

  it('shows its empty state with no rows', async () => {
    const { root } = await render(`<pf-bar-chart>${SERIES}</pf-bar-chart>`);
    expect(part(root, 'empty')?.textContent).toContain('No data');
  });

  it('treats a negative value as nothing rather than drawing upside down', async () => {
    const { root } = await render(
      `<pf-bar-chart data='${JSON.stringify([
        { label: 'a', v: -5 },
        { label: 'b', v: 10 },
      ])}'><pf-chart-series series-key="v">V</pf-chart-series></pf-bar-chart>`,
    );
    const heights = parts(root, 'bar').map((bar) => Number(bar.getAttribute('height')));

    expect(heights[0]).toBe(0);
    expect(heights.every((height) => height >= 0)).toBe(true);
  });
});
