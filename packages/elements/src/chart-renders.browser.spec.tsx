/**
 * A chart renders once as it loads, and again only when what it read changed.
 *
 * Each chart reads its children three times on the way in -- before first
 * paint, once loaded, and on the first `slotchange` -- and three of them kept
 * the result as a new array each time, which Stencil re-renders whether or not
 * it differs: `pf-line-chart`, `pf-bar-chart` and `pf-radar-chart` all
 * rendered twice on load, measured in Chromium. `src/same-records.ts` is the
 * fix. `pf-pie-chart` is here because it is the fourth chart and should stay
 * at one: its state is strings, which Stencil already compares.
 *
 * Counted by wrapping each element's `render`, which in this build is a
 * method of the element itself.
 */
import { afterEach, expect, test } from 'vitest';
import './components/pf-bar-chart/pf-bar-chart';
import './components/pf-chart-series/pf-chart-series';
import './components/pf-line-chart/pf-line-chart';
import './components/pf-pie-chart/pf-pie-chart';
import './components/pf-pie-slice/pf-pie-slice';
import './components/pf-radar-axis/pf-radar-axis';
import './components/pf-radar-chart/pf-radar-chart';

type Chart = HTMLElement & { refresh(): Promise<void> };

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

const until = async (predicate: () => boolean, what: string) => {
  const deadline = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await frame();
  }
};

const rows = JSON.stringify([
  { label: 'Jan', a: 4, b: 2 },
  { label: 'Feb', a: 6, b: 3 },
  { label: 'Mar', a: 5, b: 7 },
]);
const SERIES =
  '<pf-chart-series series-key="a">A</pf-chart-series>' +
  '<pf-chart-series series-key="b">B</pf-chart-series>';

/** Each chart, and a change to one of its children that the chart has to redraw. */
const CHARTS: [string, string, (el: Chart) => void][] = [
  [
    'pf-line-chart',
    `<pf-line-chart label="Visits" data='${rows}'>${SERIES}</pf-line-chart>`,
    (el) => el.querySelector('pf-chart-series')!.setAttribute('color', '#123456'),
  ],
  [
    'pf-bar-chart',
    `<pf-bar-chart label="Visits" data='${rows}'>${SERIES}</pf-bar-chart>`,
    (el) => el.querySelector('pf-chart-series')!.setAttribute('color', '#123456'),
  ],
  [
    'pf-pie-chart',
    '<pf-pie-chart label="Share"><pf-pie-slice value="3">A</pf-pie-slice>' +
      '<pf-pie-slice value="5">B</pf-pie-slice></pf-pie-chart>',
    (el) => el.querySelector('pf-pie-slice')!.setAttribute('value', '9'),
  ],
  [
    'pf-radar-chart',
    '<pf-radar-chart label="Skills"><pf-radar-axis label="A" value="3"></pf-radar-axis>' +
      '<pf-radar-axis label="B" value="5"></pf-radar-axis>' +
      '<pf-radar-axis label="C" value="2"></pf-radar-axis></pf-radar-chart>',
    (el) => el.querySelector('pf-radar-axis')!.setAttribute('value', '4'),
  ],
];

const restores: (() => void)[] = [];

afterEach(() => {
  document.body.innerHTML = '';
  while (restores.length > 0) restores.pop()!();
});

for (const [tag, html, change] of CHARTS) {
  test(`${tag} renders once on load, and again when a child changes`, async () => {
    await customElements.whenDefined(tag);
    const proto = customElements.get(tag)!.prototype as { render?: () => unknown };
    // A rename must fail here rather than leave the count at zero.
    expect(typeof proto.render).toBe('function');
    const original = proto.render!;
    let renders = 0;
    proto.render = function (this: unknown) {
      renders += 1;
      return original.call(this);
    };
    restores.push(() => (proto.render = original));

    document.body.innerHTML = html;
    const el = document.body.firstElementChild as Chart;
    await until(() => el.classList.contains('hydrated'), 'hydration');
    for (let i = 0; i < 6; i += 1) await frame();
    expect(renders).toBe(1);

    // The comparison must not swallow a real change.
    change(el);
    await el.refresh();
    await until(() => renders === 2, 'the redraw after a change');
  });
}
