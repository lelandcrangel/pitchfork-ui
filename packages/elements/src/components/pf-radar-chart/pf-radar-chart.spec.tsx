/**
 * The drawing's geometry and the legend the axes make up. The entrance
 * animation needs a real build, so it is in the consumer smoke.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-radar-chart';
import '../pf-radar-axis/pf-radar-axis';

const FIXTURE = (attrs = '', axes = '') => `
  <pf-radar-chart ${attrs}>
    ${
      axes ||
      `
      <pf-radar-axis label="Speed" value="8"></pf-radar-axis>
      <pf-radar-axis label="Power" value="4"></pf-radar-axis>
      <pf-radar-axis label="Range" value="2"></pf-radar-axis>
    `
    }
  </pf-radar-chart>`;

const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as (SVGElement & HTMLElement) | null;
const parts = (host: Element, name: string) =>
  Array.from(host.shadowRoot?.querySelectorAll(`[part="${name}"]`) ?? []);
const axes = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-radar-axis'));
const areaPoints = (root: HTMLElement) => part(root, 'area')?.getAttribute('points') ?? '';

describe('pf-radar-chart', () => {
  it('is a named image with a legend of its axes', async () => {
    const { root } = await render(FIXTURE('label="Vehicle profile"'));

    expect(part(root, 'svg')?.getAttribute('role')).toBe('img');
    expect(part(root, 'svg')?.getAttribute('aria-label')).toBe('Vehicle profile');
    expect(part(root, 'legend')?.tagName.toLowerCase()).toBe('ul');
    expect(axes(root).every((axis) => axis.getAttribute('role') === 'listitem')).toBe(true);
  });

  /* y grows downwards in SVG, so the first axis is 'radius' above the centre. */
  it('starts the first axis at the top', async () => {
    const { root } = await render(FIXTURE('size="200" max="8"'));
    // centre 100, radius 64, so the full-value first point is at y = 36.
    expect(areaPoints(root).split(' ')[0]).toBe('100.00,36.00');
  });

  it('draws one ring per level, the outermost at the edge', async () => {
    const { root } = await render(FIXTURE('size="200" levels="4"'));
    const rings = parts(root, 'grid');

    expect(rings).toHaveLength(4);
    expect(rings[3].getAttribute('points')?.split(' ')[0]).toBe('100.00,36.00');
  });

  it('keeps at least two rings', async () => {
    const { root } = await render(FIXTURE('levels="1"'));
    expect(parts(root, 'grid')).toHaveLength(2);
  });

  it('draws a spoke and a vertex per axis', async () => {
    const { root } = await render(FIXTURE());

    expect(parts(root, 'axis')).toHaveLength(3);
    expect(parts(root, 'point')).toHaveLength(3);
  });

  it('drops the spokes when asked', async () => {
    const { root } = await render(FIXTURE('show-axes="false"'));

    expect(parts(root, 'axis')).toHaveLength(0);
    expect(parts(root, 'grid').length).toBeGreaterThan(0);
  });

  /*
   * The names are drawn in the chart's own SVG, which is why they are an
   * attribute rather than slotted content: an SVG `<text>` cannot hold
   * arbitrary markup.
   */
  it('draws each name around the edge', async () => {
    const { root } = await render(FIXTURE());
    const labels = parts(root, 'axis-label').map((node) => node.textContent);

    expect(labels).toEqual(['Speed', 'Power', 'Range']);
  });

  it('names each legend row with the same string', async () => {
    const { root } = await render(FIXTURE());
    const rows = axes(root).map((axis) => part(axis, 'label')?.textContent);

    expect(rows).toEqual(['Speed', 'Power', 'Range']);
    expect(axes(root).map((axis) => part(axis, 'value')?.textContent)).toEqual(['8', '4', '2']);
  });

  /*
   * A point outside the outer ring is drawn outside the chart's box and
   * clipped by the viewBox, so an over-max value would simply disappear.
   */
  it('clamps a value above the scale to the outer ring', async () => {
    const { root } = await render(
      FIXTURE(
        'size="200" max="1"',
        `<pf-radar-axis label="A" value="500"></pf-radar-axis>
         <pf-radar-axis label="B" value="1"></pf-radar-axis>
         <pf-radar-axis label="C" value="1"></pf-radar-axis>`,
      ),
    );
    expect(areaPoints(root).split(' ')[0]).toBe('100.00,36.00');
  });

  it('puts a zero at the centre', async () => {
    const { root } = await render(
      FIXTURE(
        'size="200" max="8"',
        `<pf-radar-axis label="A" value="0"></pf-radar-axis>
         <pf-radar-axis label="B" value="8"></pf-radar-axis>
         <pf-radar-axis label="C" value="8"></pf-radar-axis>`,
      ),
    );
    expect(areaPoints(root).split(' ')[0]).toBe('100.00,100.00');
  });

  it('keeps a grid for a chart of all zeroes', async () => {
    const { root } = await render(
      FIXTURE(
        'size="200"',
        `<pf-radar-axis label="A" value="0"></pf-radar-axis>
         <pf-radar-axis label="B" value="0"></pf-radar-axis>
         <pf-radar-axis label="C" value="0"></pf-radar-axis>`,
      ),
    );

    expect(parts(root, 'grid').length).toBeGreaterThan(1);
    expect(areaPoints(root)).not.toMatch(/NaN/);
  });

  /* An axis with an unusable value is not drawn, so it is not a row either. */
  it('drops an axis whose value is not a number', async () => {
    const { root } = await render(
      FIXTURE(
        '',
        `<pf-radar-axis label="Bad" value="lots"></pf-radar-axis>
         <pf-radar-axis label="A" value="1"></pf-radar-axis>
         <pf-radar-axis label="B" value="1"></pf-radar-axis>
         <pf-radar-axis label="C" value="1"></pf-radar-axis>`,
      ),
    );

    expect(areaPoints(root)).not.toMatch(/NaN/);
    expect(parts(root, 'point')).toHaveLength(3);
    expect(axes(root).map((axis) => axis.hasAttribute('drawn'))).toEqual([false, true, true, true]);
    expect(parts(root, 'axis-label').map((node) => node.textContent)).toEqual(['A', 'B', 'C']);
  });

  it('drops a negative value the same way', async () => {
    const { root } = await render(
      FIXTURE(
        '',
        `<pf-radar-axis label="A" value="-1"></pf-radar-axis>
         <pf-radar-axis label="B" value="1"></pf-radar-axis>
         <pf-radar-axis label="C" value="1"></pf-radar-axis>
         <pf-radar-axis label="D" value="1"></pf-radar-axis>`,
      ),
    );
    expect(axes(root)[0].hasAttribute('drawn')).toBe(false);
  });

  /* Fewer than three axes enclose nothing. */
  it('shows its empty state below three axes', async () => {
    const { root } = await render(
      FIXTURE(
        '',
        `<pf-radar-axis label="A" value="1"></pf-radar-axis>
         <pf-radar-axis label="B" value="1"></pf-radar-axis>`,
      ),
    );

    expect(part(root, 'empty')?.textContent).toContain('at least 3 axes');
    expect(part(root, 'svg')).toBeNull();
    expect(axes(root).every((axis) => !axis.hasAttribute('drawn'))).toBe(true);
  });

  /*
   * The list stays in the tree even then: a slot that is not rendered never
   * fires `slotchange`, so an axis added later would never be counted.
   */
  it('keeps the axes slotted in its empty state', async () => {
    const { root } = await render(
      FIXTURE('', '<pf-radar-axis label="A" value="1"></pf-radar-axis>'),
    );
    expect(part(root, 'legend')?.querySelector('slot')).toBeTruthy();
  });

  it('keeps the axes slotted with the legend hidden', async () => {
    const { root } = await render(FIXTURE('show-legend="false"'));

    expect(part(root, 'legend')?.className).toContain('legend--hidden');
    expect(part(root, 'legend')?.querySelector('slot')).toBeTruthy();
    expect(parts(root, 'point')).toHaveLength(3);
  });

  it('refuses to draw smaller than it can be read', async () => {
    const { root } = await render(FIXTURE('size="40"'));
    expect(part(root, 'svg')?.getAttribute('viewBox')).toBe('0 0 180 180');
  });

  /* A nested chart owns its own axes. */
  it('ignores the axes of a chart nested inside it', async () => {
    const { root } = await render(`
      <pf-radar-chart>
        <pf-radar-axis label="A" value="1"></pf-radar-axis>
        <pf-radar-axis label="B" value="1"></pf-radar-axis>
        <div>
          <pf-radar-chart>
            <pf-radar-axis label="Deep" value="1"></pf-radar-axis>
          </pf-radar-chart>
        </div>
      </pf-radar-chart>`);

    // Two axes of its own: too few, so it shows its empty state.
    expect(part(root, 'empty')).toBeTruthy();
  });

  it('refreshes when a consumer changes a value through its property', async () => {
    const { root, waitForChanges } = await render(FIXTURE('size="200" max="8"'));
    const node = axes(root)[0] as HTMLElement & { value: number };

    node.value = 0;
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(areaPoints(root).split(' ')[0]).toBe('100.00,100.00');
  });
});
