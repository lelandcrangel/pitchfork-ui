/**
 * The geometry reaching the SVG and the meter's own reporting. The animation
 * needs a real build, so it is in the consumer smoke.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-gauge-chart';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as SVGElement & HTMLElement;

describe('pf-gauge-chart', () => {
  it('is a meter that reports its value and its range', async () => {
    const { root } = await render('<pf-gauge-chart value="30" max="60"></pf-gauge-chart>');

    expect(root.getAttribute('role')).toBe('meter');
    expect(root.getAttribute('aria-valuenow')).toBe('30');
    expect(root.getAttribute('aria-valuemin')).toBe('0');
    expect(root.getAttribute('aria-valuemax')).toBe('60');
  });

  /*
   * The name says what is measured and `aria-valuetext` says how full it is.
   * The React `GaugeChart` puts the percentage in `aria-label`, which leaves
   * a reader told "73%" with no idea what is 73% full.
   */
  it('names what it measures and reports the percentage separately', async () => {
    const { root } = await render(
      '<pf-gauge-chart value="30" max="60" label="Disk used"></pf-gauge-chart>',
    );

    expect(root.getAttribute('aria-label')).toBe('Disk used');
    expect(root.getAttribute('aria-valuetext')).toBe('50%');
  });

  it('shows the percentage in the middle by default', async () => {
    const { root } = await render('<pf-gauge-chart value="30" max="60"></pf-gauge-chart>');
    expect(part(root, 'label').textContent).toContain('50%');
  });

  /*
   * The percentage is the slot's *fallback*, which is what makes a consumer's
   * own middle label replace it. Asserted as the slot rather than as text,
   * because the mock DOM's `textContent` on a slot reports the fallback
   * whether or not anything was assigned — the consumer smoke checks the
   * override against a real build.
   */
  it('offers the middle as a slot, with the percentage as its fallback', async () => {
    const { root } = await render('<pf-gauge-chart value="30" max="60"></pf-gauge-chart>');
    const slot = part(root, 'label').querySelector('slot[name="center"]');

    expect(slot).toBeTruthy();
    expect(slot?.textContent).toContain('50%');
  });

  /* The stroke straddles the path, so the radius is inset by half of it. */
  it('insets the radius by half the stroke', async () => {
    const { root } = await render(
      '<pf-gauge-chart value="50" size="200" stroke-width="16"></pf-gauge-chart>',
    );

    expect(part(root, 'fill').getAttribute('r')).toBe('92');
    expect(part(root, 'track').getAttribute('r')).toBe('92');
  });

  it('leaves half the arc undrawn at half full', async () => {
    const { root } = await render(
      '<pf-gauge-chart value="50" size="200" stroke-width="16"></pf-gauge-chart>',
    );
    const fill = part(root, 'fill');
    const circumference = Number(fill.getAttribute('stroke-dasharray'));
    const offset = Number(
      fill.style.getPropertyValue('--pf-gauge-offset') ||
        (fill.getAttribute('style')?.match(/--pf-gauge-offset:\s*([\d.]+)/)?.[1] ?? '0'),
    );

    expect(circumference).toBeCloseTo(2 * Math.PI * 92, 3);
    expect(offset).toBeCloseTo(circumference / 2, 3);
  });

  /* The arc starts at twelve o'clock, which only a rotation gives it. */
  it('rotates the arc to start at the top', async () => {
    const { root } = await render('<pf-gauge-chart value="25" size="200"></pf-gauge-chart>');
    const style = part(root, 'fill').getAttribute('style') ?? '';

    expect(style).toContain('rotate(-90deg)');
    expect(style).toContain('100px 100px');
  });

  it('clamps an overshoot to a full arc', async () => {
    const { root } = await render('<pf-gauge-chart value="500" max="100"></pf-gauge-chart>');
    const style = part(root, 'fill').getAttribute('style') ?? '';

    expect(root.getAttribute('aria-valuetext')).toBe('100%');
    expect(style).toMatch(/--pf-gauge-offset:\s*0/);
  });

  /*
   * `Math.max(NaN, 0)` is `NaN`, which is how the React version reached the
   * DOM as `--pf-gauge-offset: NaN`. Core's clamp catches it.
   */
  it('draws an empty arc for a value that is not a number', async () => {
    const { root } = await render('<pf-gauge-chart value="lots"></pf-gauge-chart>');
    const style = part(root, 'fill').getAttribute('style') ?? '';

    expect(style).not.toMatch(/NaN/);
    expect(root.getAttribute('aria-valuetext')).toBe('0%');
  });

  it('draws an empty arc for a max of zero', async () => {
    const { root } = await render('<pf-gauge-chart value="10" max="0"></pf-gauge-chart>');
    expect(part(root, 'fill').getAttribute('style') ?? '').not.toMatch(/NaN/);
  });

  it('sizes the svg and the host together', async () => {
    const { root } = await render('<pf-gauge-chart value="10" size="120"></pf-gauge-chart>');
    const svg = root.shadowRoot?.querySelector('svg');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 120 120');
    expect(root.style.width).toBe('120px');
    expect(root.style.height).toBe('120px');
  });

  /* The arc is decoration: the host already reports the value. */
  it('hides the drawing from the accessibility tree', async () => {
    const { root } = await render('<pf-gauge-chart value="10"></pf-gauge-chart>');

    expect(root.shadowRoot?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(part(root, 'center').getAttribute('aria-hidden')).toBe('true');
  });

  /*
   * No wrapper around the sub-label's slot: an unassigned slot is
   * `display: contents` and generates nothing, where a wrapper would be a
   * flex item costing a gap and could not be collapsed from CSS.
   */
  it('wraps the sub-label slot in nothing', async () => {
    const { root } = await render('<pf-gauge-chart value="10"></pf-gauge-chart>');
    const slot = root.shadowRoot?.querySelector('slot[name="sub"]');

    expect(slot).toBeTruthy();
    expect(slot?.parentElement?.getAttribute('part')).toBe('center');
  });

  it('takes a colour of its own', async () => {
    const { root } = await render('<pf-gauge-chart value="10" color="tomato"></pf-gauge-chart>');
    expect(part(root, 'fill').getAttribute('stroke')).toBe('tomato');
  });
});
