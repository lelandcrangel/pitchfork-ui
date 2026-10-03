/**
 * The geometry reaching the SVG, and the attribute coercion. The animation
 * needs a real build to run at all, so it is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-sparkline';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as SVGElement | null;
const path = (root: HTMLElement, name: string) => part(root, name)?.getAttribute('d') ?? '';

describe('pf-sparkline', () => {
  it('draws a line through the values', async () => {
    const { root } = await render(
      '<pf-sparkline data="0,5,10" width="100" height="40" stroke-width="2"></pf-sparkline>',
    );

    // padding = strokeWidth + 2 = 4, so the inner box is 92 x 32.
    expect(path(root, 'line')).toBe('M 4 36 L 50 20 L 96 4');
  });

  /*
   * Stencil coerces an attribute only for the primitive types it recognises,
   * so an array prop arrives as the string verbatim — the same trap
   * `pf-time-picker.hourCycle` hit. The comma-separated form is read through
   * a getter.
   */
  it('takes its values from a comma-separated attribute', async () => {
    const { root } = await render('<pf-sparkline data=" 1 , 4 , 2 "></pf-sparkline>');
    expect(path(root, 'line').split('L')).toHaveLength(3);
  });

  it('takes its values from an array property', async () => {
    const { root } = await render('<pf-sparkline width="100" height="40"></pf-sparkline>');
    const node = root as HTMLElement & { data: number[] };

    node.data = [0, 10];
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(path(root, 'line')).toContain('M');
  });

  it('ignores values that are not numbers', async () => {
    const { root } = await render('<pf-sparkline data="1,oops,3"></pf-sparkline>');
    const d = path(root, 'line');

    expect(d).not.toMatch(/NaN/);
    expect(d.split('L')).toHaveLength(2);
  });

  it('draws only a line by default', async () => {
    const { root } = await render('<pf-sparkline data="1,4,2"></pf-sparkline>');

    expect(part(root, 'line')).toBeTruthy();
    expect(part(root, 'area')).toBeNull();
    expect(part(root, 'dot')).toBeNull();
  });

  it('fills under the line on the area variant', async () => {
    const { root } = await render('<pf-sparkline data="1,4,2" variant="area"></pf-sparkline>');
    const d = path(root, 'area');

    expect(d.endsWith('Z')).toBe(true);
    expect(d).not.toMatch(/true|false|NaN|undefined/);
  });

  it('marks the last value when asked', async () => {
    const { root } = await render(
      '<pf-sparkline data="0,10" width="100" height="40" stroke-width="2" end-dot></pf-sparkline>',
    );
    const dot = part(root, 'dot');

    expect(dot?.getAttribute('cx')).toBe('96');
    expect(dot?.getAttribute('cy')).toBe('4');
  });

  /* One value divides by zero in the naive form, and `cx="NaN"` is invalid. */
  it('places a single value in the middle rather than nowhere', async () => {
    const { root } = await render(
      '<pf-sparkline data="7" width="100" height="40" end-dot></pf-sparkline>',
    );
    const dot = part(root, 'dot');

    expect(dot?.getAttribute('cx')).toBe('50');
    expect(dot?.getAttribute('cy')).toBe('20');
    expect(part(root, 'line')).toBeNull();
  });

  it('centres a flat series', async () => {
    const { root } = await render(
      '<pf-sparkline data="5,5,5" width="100" height="40"></pf-sparkline>',
    );
    expect(path(root, 'line')).toBe('M 3.5 20 L 50 20 L 96.5 20');
  });

  it('draws nothing at all from no data', async () => {
    const { root } = await render('<pf-sparkline></pf-sparkline>');

    expect(part(root, 'line')).toBeNull();
    expect(part(root, 'dot')).toBeNull();
    expect(root.shadowRoot?.querySelector('svg')).toBeTruthy();
  });

  /*
   * A sparkline with no name is decoration beside a number that already says
   * what it means, so announcing it is worse than skipping it.
   */
  it('is presentation without a name and an image with one', async () => {
    const bare = await render('<pf-sparkline data="1,2"></pf-sparkline>');
    expect(bare.root.shadowRoot?.querySelector('svg')?.getAttribute('role')).toBe('presentation');

    const named = await render('<pf-sparkline data="1,2" label="Weekly signups"></pf-sparkline>');
    const svg = named.root.shadowRoot?.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Weekly signups');
  });

  it('sizes the svg and its viewBox together', async () => {
    const { root } = await render(
      '<pf-sparkline data="1,2" width="200" height="60"></pf-sparkline>',
    );
    const svg = root.shadowRoot?.querySelector('svg');

    expect(svg?.getAttribute('width')).toBe('200');
    expect(svg?.getAttribute('height')).toBe('60');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 200 60');
  });

  /* The dash maths only works against a declared path length. */
  it('declares a path length only while animating', async () => {
    const still = await render('<pf-sparkline data="1,2"></pf-sparkline>');
    expect(part(still.root, 'line')?.hasAttribute('pathLength')).toBe(false);

    const moving = await render('<pf-sparkline data="1,2" animated></pf-sparkline>');
    expect(part(moving.root, 'line')?.getAttribute('pathLength')).toBe('1');
  });

  it('takes a colour of its own', async () => {
    const { root } = await render('<pf-sparkline data="1,2" color="rebeccapurple"></pf-sparkline>');
    expect(part(root, 'line')?.getAttribute('stroke')).toBe('rebeccapurple');
  });

  it('falls back to the token colour', async () => {
    const { root } = await render('<pf-sparkline data="1,2"></pf-sparkline>');
    expect(part(root, 'line')?.getAttribute('stroke')).toBe('var(--pf-sparkline-color)');
  });
});
