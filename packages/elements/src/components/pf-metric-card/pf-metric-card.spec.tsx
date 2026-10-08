/**
 * The markup, and which boxes are drawn. `slotchange` — a trend or an action
 * arriving after mount — is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-metric-card';
import '../pf-metric-grid/pf-metric-grid';

const FIXTURE = (attrs = '', extra = '') => `
  <pf-metric-card ${attrs}>
    <span slot="heading">Revenue</span>
    £24,500
    ${extra}
  </pf-metric-card>`;

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const isEmpty = (root: HTMLElement, name: string) =>
  part(root, name)?.classList.contains('empty') ?? null;

describe('pf-metric-card', () => {
  it('renders the heading and the number', async () => {
    const { root } = await render(FIXTURE());

    expect(part(root, 'heading')?.tagName.toLowerCase()).toBe('p');
    expect(part(root, 'value')?.tagName.toLowerCase()).toBe('p');
    expect(root.textContent).toContain('Revenue');
    expect(root.textContent).toContain('£24,500');
  });

  it('defaults to a neutral trend and takes the others', async () => {
    const { root: neutral } = await render(FIXTURE());
    expect(neutral.getAttribute('trend')).toBe('neutral');

    const { root: positive } = await render(FIXTURE('trend="positive"'));
    expect(positive.getAttribute('trend')).toBe('positive');
  });

  it('draws the trend pill only when something is slotted into it', async () => {
    const { root: without } = await render(FIXTURE('trend="positive"'));
    expect(isEmpty(without, 'trend')).toBe(true);

    const { root: with_ } = await render(
      FIXTURE('trend="positive"', '<span slot="trend">12% on last month</span>'),
    );
    expect(isEmpty(with_, 'trend')).toBe(false);
    expect(with_.shadowRoot?.querySelector('.trend-symbol')?.textContent).toBe('+');
  });

  it('draws the trend symbol for each direction, hidden from the tree', async () => {
    for (const [trend, symbol] of [
      ['positive', '+'],
      ['negative', '-'],
      ['neutral', '='],
    ]) {
      const { root } = await render(
        FIXTURE(`trend="${trend}"`, '<span slot="trend">on last month</span>'),
      );
      const node = root.shadowRoot?.querySelector('.trend-symbol');
      expect(node?.textContent).toBe(symbol);
      expect(node?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  /* A nonsense trend falls back rather than drawing nothing at all. */
  it('falls back to the neutral symbol for a trend it does not know', async () => {
    const { root } = await render(
      FIXTURE('trend="sideways"', '<span slot="trend">on last month</span>'),
    );
    expect(root.shadowRoot?.querySelector('.trend-symbol')?.textContent).toBe('=');
  });

  it('renders an icon from a name, and lets a slotted one win', async () => {
    const { root: named } = await render(FIXTURE('icon="chart-bar"'));
    expect(isEmpty(named, 'icon')).toBe(false);
    expect(part(named, 'icon')?.querySelector('pf-icon')?.getAttribute('name')).toBe('chart-bar');

    const { root: slotted } = await render(
      FIXTURE('icon="chart-bar"', '<img slot="icon" src="i.svg" alt="" />'),
    );
    expect(part(slotted, 'icon')?.querySelector('pf-icon')).toBeNull();
  });

  /*
   * Hidden rather than left out: a slot that is not rendered never fires
   * `slotchange`, so content added later would stay invisible for good.
   */
  it('keeps every optional slot in the tree', async () => {
    const { root } = await render(FIXTURE());

    expect(isEmpty(root, 'icon')).toBe(true);
    expect(isEmpty(root, 'action')).toBe(true);
    expect(isEmpty(root, 'trend')).toBe(true);
    for (const name of ['icon', 'action', 'trend', 'description']) {
      expect(root.shadowRoot?.querySelector(`slot[name="${name}"]`)).not.toBeNull();
    }
  });

  it('draws the action box when something is slotted into it', async () => {
    const { root } = await render(
      FIXTURE('', '<button slot="action" type="button">Export</button>'),
    );
    expect(isEmpty(root, 'action')).toBe(false);
  });

  it('gives the description no wrapper', async () => {
    const { root } = await render(FIXTURE('', '<span slot="description">Since April</span>'));

    expect(part(root, 'description')).toBeNull();
    expect(root.shadowRoot?.querySelector('slot[name="description"]')).not.toBeNull();
  });
});

describe('pf-metric-grid', () => {
  it('slots its cards straight into the grid', async () => {
    const { root } = await render(`
      <pf-metric-grid>
        ${FIXTURE()}
        ${FIXTURE()}
      </pf-metric-grid>`);

    expect(root.shadowRoot?.querySelector('slot')).not.toBeNull();
    expect(root.querySelectorAll('pf-metric-card')).toHaveLength(2);
  });
});
