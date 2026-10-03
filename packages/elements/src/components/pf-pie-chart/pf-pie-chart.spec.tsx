/**
 * The wedges, the legend the slices make up, and the answers the chart pushes
 * down to them. `slotchange` is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-pie-chart';
import '../pf-pie-slice/pf-pie-slice';

const FIXTURE = (attrs = '', slices = '') => `
  <pf-pie-chart ${attrs}>
    ${
      slices ||
      `
      <pf-pie-slice value="1">Direct</pf-pie-slice>
      <pf-pie-slice value="3">Search</pf-pie-slice>
    `
    }
  </pf-pie-chart>`;

const slices = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-pie-slice'));
const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const gradient = (root: HTMLElement) =>
  part(root, 'gradient').style.getPropertyValue('--pf-pie-gradient') ||
  (part(root, 'gradient')
    .getAttribute('style')
    ?.match(/--pf-pie-gradient:\s*([^;]+)/)?.[1] ??
    '');
const shares = (root: HTMLElement) =>
  slices(root).map((slice) => (slice as HTMLElement & { share: number }).share);

describe('pf-pie-chart', () => {
  it('is a named image with a legend of its slices', async () => {
    const { root } = await render(FIXTURE('label="Traffic sources"'));

    expect(part(root, 'visual').getAttribute('role')).toBe('img');
    expect(part(root, 'visual').getAttribute('aria-label')).toBe('Traffic sources');
    expect(part(root, 'legend').tagName.toLowerCase()).toBe('ul');
    expect(slices(root).every((slice) => slice.getAttribute('role') === 'listitem')).toBe(true);
  });

  it('shares the total out between the slices', async () => {
    const { root } = await render(FIXTURE());
    expect(shares(root)).toEqual([25, 75]);
  });

  it('paints one hard stop per slice, ending where the next begins', async () => {
    const { root } = await render(FIXTURE());
    expect(gradient(root)).toContain('0% 25%');
    expect(gradient(root)).toContain('25% 100%');
  });

  it('gives each slice a palette colour in order', async () => {
    const { root } = await render(FIXTURE());
    const swatches = slices(root).map(
      (slice) => (slice as HTMLElement & { swatch: string }).swatch,
    );

    expect(swatches[0]).toBe('var(--pf-chart-color-1)');
    expect(swatches[1]).toBe('var(--pf-chart-color-2)');
  });

  it('takes a colour a slice asked for', async () => {
    const { root } = await render(
      FIXTURE('', '<pf-pie-slice value="1" color="tomato">One</pf-pie-slice>'),
    );
    expect((slices(root)[0] as HTMLElement & { swatch: string }).swatch).toBe('tomato');
  });

  /* A slice of zero is not a wedge, so it is not a legend row either. */
  it('leaves a slice of zero out of the drawing and the legend', async () => {
    const { root } = await render(
      FIXTURE(
        '',
        `<pf-pie-slice value="3">Shown</pf-pie-slice>
         <pf-pie-slice value="0">Empty</pf-pie-slice>`,
      ),
    );

    expect(slices(root).map((slice) => slice.hasAttribute('drawn'))).toEqual([true, false]);
    expect(shares(root)).toEqual([100, 0]);
  });

  /*
   * The answer has to reach the slice it belongs to: the drawable slices are
   * filtered, so their own positions no longer line up with the children.
   */
  it('carries each share back to the slice it came from', async () => {
    const { root } = await render(
      FIXTURE(
        '',
        `<pf-pie-slice value="0">First</pf-pie-slice>
         <pf-pie-slice value="1">Second</pf-pie-slice>
         <pf-pie-slice value="1">Third</pf-pie-slice>`,
      ),
    );

    expect(shares(root)).toEqual([0, 50, 50]);
    expect(slices(root).map((slice) => slice.hasAttribute('drawn'))).toEqual([false, true, true]);
  });

  /* Rounding each share on its own shows three equal thirds as 33/33/33. */
  it('prints shares that add up to 100', async () => {
    const { root } = await render(
      FIXTURE(
        '',
        `<pf-pie-slice value="1">A</pf-pie-slice>
         <pf-pie-slice value="1">B</pf-pie-slice>
         <pf-pie-slice value="1">C</pf-pie-slice>`,
      ),
    );

    expect(shares(root)).toEqual([34, 33, 33]);
    expect(shares(root).reduce((sum, value) => sum + value, 0)).toBe(100);
  });

  /*
   * One value that is not a number used to take the whole chart with it: the
   * total was computed before the filter, so every surviving slice came out
   * at `NaN%` and the gradient was invalid.
   */
  it('draws the rest when one value is not a number', async () => {
    const { root } = await render(
      FIXTURE(
        '',
        `<pf-pie-slice value="lots">Bad</pf-pie-slice>
         <pf-pie-slice value="4">Good</pf-pie-slice>`,
      ),
    );

    expect(gradient(root)).not.toMatch(/NaN/);
    expect(shares(root)).toEqual([0, 100]);
  });

  it('shows its empty state when nothing is drawable', async () => {
    const { root } = await render(FIXTURE('', '<pf-pie-slice value="0">Nothing</pf-pie-slice>'));

    expect(part(root, 'center').textContent).toContain('No data');
    expect(part(root, 'visual').className).toContain('visual--empty');
    expect(gradient(root)).toContain('--pf-piechart-empty');
  });

  /*
   * "No data" is the slot's *fallback*, which is what lets a consumer replace
   * it. Asserted as the slot here rather than as text, because the mock DOM's
   * `textContent` on a slot reports the fallback whether or not anything was
   * assigned — the browser spec checks the override.
   */
  it('offers the empty state as a slot with a fallback', async () => {
    const { root } = await render(FIXTURE('', '<pf-pie-slice value="0">x</pf-pie-slice>'));
    const slot = part(root, 'center').querySelector('slot[name="empty"]');

    expect(slot).toBeTruthy();
    expect(slot?.textContent).toContain('No data');
  });

  it('shows the centre slot once there is data', async () => {
    const { root } = await render(
      FIXTURE('', '<span slot="center">4k</span><pf-pie-slice value="4">x</pf-pie-slice>'),
    );

    expect(part(root, 'center').querySelector('slot[name="center"]')).toBeTruthy();
    expect(part(root, 'center').querySelector('slot[name="empty"]')).toBeNull();
  });

  it('sizes the hole from the cutout', async () => {
    const { root } = await render(FIXTURE('size="200" cutout="0.5"'));
    expect(part(root, 'center').style.width).toBe('100px');
  });

  it('refuses a cutout that would leave no chart', async () => {
    const { root } = await render(FIXTURE('size="200" cutout="1"'));
    expect(part(root, 'center').style.width).toBe('176px');
  });

  it('refuses to draw smaller than it can be read', async () => {
    const { root } = await render(FIXTURE('size="40"'));
    expect(part(root, 'visual').style.width).toBe('120px');
  });

  /*
   * The legend is hidden rather than dropped: the slices are the data, so
   * they have to stay slotted even when nobody is looking at the list.
   */
  it('keeps the slices slotted with the legend hidden', async () => {
    const { root } = await render(FIXTURE('show-legend="false"'));

    expect(part(root, 'legend').className).toContain('legend--hidden');
    expect(part(root, 'legend').querySelector('slot')).toBeTruthy();
    expect(shares(root)).toEqual([25, 75]);
  });

  /* A nested chart owns its own slices. */
  it('ignores the slices of a chart nested inside it', async () => {
    const { root } = await render(`
      <pf-pie-chart>
        <pf-pie-slice value="1">Outer</pf-pie-slice>
        <div>
          <pf-pie-chart>
            <pf-pie-slice value="9">Inner</pf-pie-slice>
          </pf-pie-chart>
        </div>
      </pf-pie-chart>`);

    const outer = slices(root).find((slice) => slice.textContent?.trim() === 'Outer');
    expect((outer as HTMLElement & { share: number }).share).toBe(100);
  });

  it('refreshes when a consumer changes a value through its property', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const node = slices(root)[0] as HTMLElement & { value: number };

    node.value = 3;
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(shares(root)).toEqual([50, 50]);
  });
});
