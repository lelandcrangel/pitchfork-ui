/**
 * The markup the fast project can see: roles, the id wiring in both
 * directions, which panel is hidden, the state pushed down onto each tab, and
 * where the single tab stop sits.
 *
 * Keyboard navigation, `slotchange` and the indicator's coordinates are in the
 * browser spec — the first needs real focus, the second never fires here, and
 * the third needs layout, which neither test project's DOM does.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-tabs';
import '../pf-tab/pf-tab';
import '../pf-tab-panel/pf-tab-panel';
import '../pf-icon/pf-icon';
import '../pf-badge/pf-badge';

const FIXTURE = (attrs = '') => `
  <pf-tabs ${attrs}>
    <pf-tab value="overview">Overview</pf-tab>
    <pf-tab-panel value="overview">Overview content</pf-tab-panel>
    <pf-tab value="details">Details</pf-tab>
    <pf-tab-panel value="details">Details content</pf-tab-panel>
    <pf-tab value="history" disabled>History</pf-tab>
    <pf-tab-panel value="history">History content</pf-tab-panel>
  </pf-tabs>`;

const tabs = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-tab'));
const panels = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-tab-panel'));
const tab = (root: HTMLElement, value: string) =>
  root.querySelector(`pf-tab[value="${value}"]`) as HTMLElement;
const panel = (root: HTMLElement, value: string) =>
  root.querySelector(`pf-tab-panel[value="${value}"]`) as HTMLElement;
const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

describe('pf-tabs', () => {
  it('renders a tablist over a panel stack', async () => {
    const { root } = await render(FIXTURE());

    expect(part(root, 'list')?.getAttribute('role')).toBe('tablist');
    expect(part(root, 'list')?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(tabs(root).every((el) => el.getAttribute('role') === 'tab')).toBe(true);
    expect(panels(root).every((el) => el.getAttribute('role') === 'tabpanel')).toBe(true);
  });

  it('selects the first enabled tab by default', async () => {
    const { root } = await render(FIXTURE());

    expect(tab(root, 'overview').getAttribute('aria-selected')).toBe('true');
    expect(tab(root, 'details').getAttribute('aria-selected')).toBe('false');
  });

  it('selects the tab named by value', async () => {
    const { root } = await render(FIXTURE('value="details"'));

    expect(tab(root, 'details').getAttribute('aria-selected')).toBe('true');
    expect(tab(root, 'overview').getAttribute('aria-selected')).toBe('false');
  });

  /* Core's fallback, so the React Tabs lands on the same tab. */
  it('falls back to the first enabled tab for a disabled or unknown value', async () => {
    const { root: disabledValue } = await render(FIXTURE('value="history"'));
    expect(tab(disabledValue, 'overview').getAttribute('aria-selected')).toBe('true');

    const { root: unknownValue } = await render(FIXTURE('value="nope"'));
    expect(tab(unknownValue, 'overview').getAttribute('aria-selected')).toBe('true');
  });

  /*
   * Both directions, and both resolve: tab and panel are siblings in the
   * consumer's tree, which is the one case where an IDREF between two of this
   * library's elements works at all.
   */
  it('wires each tab to its panel, and the panel back to its tab', async () => {
    const { root } = await render(FIXTURE());

    for (const value of ['overview', 'details', 'history']) {
      const tabEl = tab(root, value);
      const panelEl = panel(root, value);
      expect(tabEl.id).toBeTruthy();
      expect(panelEl.id).toBeTruthy();
      expect(tabEl.getAttribute('aria-controls')).toBe(panelEl.id);
      expect(panelEl.getAttribute('aria-labelledby')).toBe(tabEl.id);
    }
  });

  it('keeps ids a consumer set', async () => {
    const { root } = await render(`
      <pf-tabs>
        <pf-tab id="mine" value="a">A</pf-tab>
        <pf-tab-panel id="mine-panel" value="a">A content</pf-tab-panel>
      </pf-tabs>`);

    expect(tab(root, 'a').getAttribute('aria-controls')).toBe('mine-panel');
    expect(panel(root, 'a').getAttribute('aria-labelledby')).toBe('mine');
  });

  /*
   * `hidden`, not a class: it hides the panel through the UA stylesheet, so a
   * consumer who has not loaded this package's CSS still sees one panel.
   */
  it('shows one panel and hides the rest', async () => {
    const { root } = await render(FIXTURE('value="details"'));

    expect(panel(root, 'details').hasAttribute('hidden')).toBe(false);
    expect(panel(root, 'details').hasAttribute('active')).toBe(true);
    expect(panel(root, 'overview').hasAttribute('hidden')).toBe(true);
    expect(panel(root, 'history').hasAttribute('hidden')).toBe(true);
  });

  it('makes only the shown panel tabbable', async () => {
    const { root } = await render(FIXTURE());

    expect(panel(root, 'overview').getAttribute('tabindex')).toBe('0');
    expect(panel(root, 'details').hasAttribute('tabindex')).toBe(false);
  });

  it('pushes variant, size and full width down onto every tab', async () => {
    const { root } = await render(FIXTURE('variant="pills" size="sm" full-width'));

    for (const el of tabs(root)) {
      expect(el.getAttribute('variant')).toBe('pills');
      expect(el.getAttribute('size')).toBe('sm');
      expect(el.hasAttribute('full-width')).toBe(true);
    }
  });

  /*
   * One tab stop for the strip, on the selected tab — tabbing in lands on the
   * tab whose panel is showing, which is the ARIA pattern.
   */
  it('is a single tab stop, on the selected tab', async () => {
    const { root } = await render(FIXTURE('value="details"'));

    expect(tab(root, 'details').getAttribute('tabindex')).toBe('0');
    expect(tab(root, 'overview').getAttribute('tabindex')).toBe('-1');
    expect(tab(root, 'history').getAttribute('tabindex')).toBe('-1');
  });

  it('never makes a disabled tab the tab stop', async () => {
    const { root } = await render(`
      <pf-tabs>
        <pf-tab value="a" disabled>A</pf-tab>
        <pf-tab value="b">B</pf-tab>
        <pf-tab-panel value="a">A</pf-tab-panel>
        <pf-tab-panel value="b">B</pf-tab-panel>
      </pf-tabs>`);

    expect(tab(root, 'a').getAttribute('tabindex')).toBe('-1');
    expect(tab(root, 'b').getAttribute('tabindex')).toBe('0');
    expect(tab(root, 'b').getAttribute('aria-selected')).toBe('true');
  });

  it('marks a disabled tab, and leaves it unselectable', async () => {
    const { root } = await render(FIXTURE());

    const history = tab(root, 'history');
    expect(history.getAttribute('aria-disabled')).toBe('true');

    history.click();
    expect(history.getAttribute('aria-selected')).toBe('false');
    expect(tab(root, 'overview').getAttribute('aria-selected')).toBe('true');
  });

  it('selects on click, and reports the change once', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const changes: string[] = [];
    root.addEventListener('pfChange', (event) =>
      changes.push((event as CustomEvent<{ value: string }>).detail.value),
    );

    tab(root, 'details').click();
    await waitForChanges();

    expect((root as HTMLElement & { value: string }).value).toBe('details');
    expect(tab(root, 'details').getAttribute('aria-selected')).toBe('true');
    expect(panel(root, 'details').hasAttribute('hidden')).toBe(false);
    expect(panel(root, 'overview').hasAttribute('hidden')).toBe(true);
    expect(changes).toEqual(['details']);
  });

  /*
   * With `value` unset the first enabled tab is already the selected one, so
   * clicking it is not a change — even though `value` itself moves from '' to
   * 'overview'.
   */
  it('stays quiet when the selected tab is clicked again', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const changes: string[] = [];
    root.addEventListener('pfChange', () => changes.push('x'));

    tab(root, 'overview').click();
    await waitForChanges();

    expect(changes).toEqual([]);
    expect((root as HTMLElement & { value: string }).value).toBe('overview');
  });

  /*
   * A property change leaves no attribute, moves no node and fires no
   * `slotchange`, so nothing here could notice it without being told.
   */
  it('re-reads the children on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const tabsEl = root as HTMLElement & { refresh(): Promise<void> };

    (tab(root, 'overview') as HTMLElement & { disabled: boolean }).disabled = true;
    await tabsEl.refresh();
    await waitForChanges();

    expect(tab(root, 'overview').getAttribute('aria-selected')).toBe('false');
    expect(tab(root, 'details').getAttribute('aria-selected')).toBe('true');
    expect(panel(root, 'details').hasAttribute('hidden')).toBe(false);
  });

  it('leaves a nested tab set its own tabs', async () => {
    const { root } = await render(`
      <pf-tabs value="outer-b">
        <pf-tab value="outer-a">Outer A</pf-tab>
        <pf-tab value="outer-b">Outer B</pf-tab>
        <pf-tab-panel value="outer-a">
          <pf-tabs>
            <pf-tab value="inner">Inner</pf-tab>
            <pf-tab-panel value="inner">Inner content</pf-tab-panel>
          </pf-tabs>
        </pf-tab-panel>
        <pf-tab-panel value="outer-b">Outer B content</pf-tab-panel>
      </pf-tabs>`);

    // The outer group would otherwise see three tabs and push its state onto
    // the inner one, whose own value is the only thing that governs it.
    expect(root.querySelector('pf-tab[value="inner"]')?.getAttribute('aria-selected')).toBe('true');
    expect(tab(root, 'outer-b').getAttribute('tabindex')).toBe('0');
  });
});

describe('pf-tab', () => {
  it('puts itself in the group’s tab slot', async () => {
    const { root } = await render(FIXTURE());

    expect(tabs(root).every((el) => el.getAttribute('slot') === 'tab')).toBe(true);
    expect(panels(root).some((el) => el.hasAttribute('slot'))).toBe(false);
  });

  it('leaves a slot the consumer set alone', async () => {
    const { root } = await render(`
      <pf-tabs><pf-tab slot="elsewhere" value="a">A</pf-tab></pf-tabs>`);

    expect(tab(root, 'a').getAttribute('slot')).toBe('elsewhere');
  });

  it('renders a count badge, and a zero count', async () => {
    const { root } = await render(`
      <pf-tabs>
        <pf-tab value="issues" count="12">Issues</pf-tab>
        <pf-tab value="zero" count="0">Zero</pf-tab>
        <pf-tab value="none">None</pf-tab>
      </pf-tabs>`);

    expect(tab(root, 'issues').shadowRoot?.querySelector('[part="count"]')?.textContent).toBe('12');
    expect(tab(root, 'zero').shadowRoot?.querySelector('[part="count"]')?.textContent).toBe('0');
    expect(tab(root, 'none').shadowRoot?.querySelector('[part="count"]')).toBeNull();
  });

  it('renders a decorative icon, and places it either side of the label', async () => {
    const { root } = await render(`
      <pf-tabs>
        <pf-tab value="start" icon="star">Starred</pf-tab>
        <pf-tab value="end" icon="star" icon-placement="end">Docs</pf-tab>
      </pf-tabs>`);

    const icon = tab(root, 'start').shadowRoot?.querySelector('[part="icon"]');
    expect(icon?.tagName.toLowerCase()).toBe('pf-icon');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');

    const order = (value: string) =>
      Array.from(tab(root, value).shadowRoot?.children ?? []).map((child) =>
        child.getAttribute('part'),
      );
    expect(order('start')).toEqual(['icon', 'label']);
    expect(order('end')).toEqual(['label', 'icon']);
  });

  it('places the count badge either side of the label', async () => {
    const { root } = await render(`
      <pf-tabs>
        <pf-tab value="end" count="3">End</pf-tab>
        <pf-tab value="start" count="3" badge-placement="start">Start</pf-tab>
      </pf-tabs>`);

    const order = (value: string) =>
      Array.from(tab(root, value).shadowRoot?.children ?? []).map((child) =>
        child.getAttribute('part'),
      );
    expect(order('end')).toEqual(['label', 'count']);
    expect(order('start')).toEqual(['count', 'label']);
  });
});
