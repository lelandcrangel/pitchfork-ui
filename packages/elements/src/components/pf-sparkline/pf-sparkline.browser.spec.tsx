/**
 * The geometry as the browser actually laid it out — `getPointAtLength` and
 * `getBBox` need a real SVG engine, which the mock DOM has none of.
 */
import { afterEach, expect, test } from 'vitest';
import './pf-sparkline';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const mount = async (attrs = '') => {
  document.body.innerHTML = `<pf-sparkline ${attrs}></pf-sparkline>`;
  await customElements.whenDefined('pf-sparkline');
  await frame();
  await frame();
  return document.querySelector('pf-sparkline') as HTMLElement;
};

const part = (el: HTMLElement, name: string) =>
  el.shadowRoot!.querySelector(`[part='${name}']`) as SVGElement;

afterEach(() => {
  document.body.innerHTML = '';
});

/*
 * The real geometry, read off the laid-out path rather than off its `d`: the
 * line has to end at the point the dot is drawn at, which is what makes the
 * two agree about where "the last value" is.
 */
test('the dot sits on the end of the line', async () => {
  const el = await mount('data="0,5,10" width="100" height="40" end-dot');
  const line = part(el, 'line') as unknown as SVGPathElement;
  const dot = part(el, 'dot') as unknown as SVGCircleElement;

  const end = line.getPointAtLength(line.getTotalLength());
  expect(end.x).toBeCloseTo(dot.cx.baseVal.value, 1);
  expect(end.y).toBeCloseTo(dot.cy.baseVal.value, 1);
});

/* The area closes back to the baseline, so it is a region and not a line. */
test('the area encloses the line', async () => {
  const el = await mount('data="0,5,10" width="100" height="40" variant="area"');
  const area = part(el, 'area') as unknown as SVGPathElement;
  const line = part(el, 'line') as unknown as SVGPathElement;

  expect(area.getTotalLength()).toBeGreaterThan(line.getTotalLength());
  const box = area.getBBox();
  expect(box.height).toBeGreaterThan(line.getBBox().height);
});

/*
 * The animations are **not** here, and cannot be: neither test project
 * applies `styleUrl` CSS, so `getAnimations()` returns an empty list whether
 * the `@keyframes` copy exists or not — measured, by writing the assertions
 * and watching all three fail against a correct element.
 * `scripts/smoke-consumer.mjs` asserts them against a real build, which is
 * also where a missing shadow-root copy of the keyframes would show up.
 *
 * What a browser can still show here is that the element declares what the
 * animation needs.
 */
test('it declares the path length the dash maths needs, only while animating', async () => {
  const still = await mount('data="0,5,10"');
  expect((part(still, 'line') as unknown as SVGPathElement).pathLength.baseVal).toBe(0);

  document.body.innerHTML = '';
  const moving = await mount('data="0,5,10" animated');
  expect((part(moving, 'line') as unknown as SVGPathElement).pathLength.baseVal).toBe(1);
});
