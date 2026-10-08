/**
 * The markup and the pushed-down state. `slotchange` and the boxes the slots
 * do or do not generate are in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-timeline';
import '../pf-timeline-item/pf-timeline-item';

const FIXTURE = (attrs = '') => `
  <pf-timeline ${attrs}>
    <pf-timeline-item tone="success">
      <span slot="title">Deployed</span>
      <span slot="timestamp">2 hours ago</span>
      <span slot="description">Version 1.4.0 went out.</span>
      <span slot="icon">✓</span>
    </pf-timeline-item>
    <pf-timeline-item>
      <span slot="title">Reviewed</span>
    </pf-timeline-item>
    <pf-timeline-item tone="danger">
      <span slot="title">Opened</span>
    </pf-timeline-item>
  </pf-timeline>`;

const items = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-timeline-item'));
const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;

describe('pf-timeline', () => {
  it('is a list of list items', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBe('list');
    expect(items(root).every((item) => item.getAttribute('role') === 'listitem')).toBe(true);
  });

  it('takes a name', async () => {
    const { root } = await render(FIXTURE('label="Release history"'));
    expect(root.getAttribute('aria-label')).toBe('Release history');
  });

  it('draws a connector after every entry but the last', async () => {
    const { root } = await render(FIXTURE());
    const [first, second, third] = items(root);

    expect(part(first, 'connector')).not.toBeNull();
    expect(part(second, 'connector')).not.toBeNull();
    expect(part(third, 'connector')).toBeNull();
    expect(third.hasAttribute('last')).toBe(true);
    expect(first.hasAttribute('last')).toBe(false);
  });

  it('hides the rail from the accessibility tree', async () => {
    const { root } = await render(FIXTURE());
    expect(part(items(root)[0], 'rail')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps each entry’s own tone', async () => {
    const { root } = await render(FIXTURE());
    expect(items(root).map((item) => item.getAttribute('tone'))).toEqual([
      'success',
      'default',
      'danger',
    ]);
  });

  /*
   * Read from the light DOM in `componentWillLoad`, so the marker is the right
   * size at first paint. The class comes from JS because `:has(*)` on a
   * wrapper around a slot always matches — the slot is itself a child.
   */
  it('marks the marker that carries an icon, and only that one', async () => {
    const { root } = await render(FIXTURE());
    const [withIcon, withoutIcon] = items(root);

    expect(part(withIcon, 'marker')?.classList.contains('with-icon')).toBe(true);
    expect(part(withoutIcon, 'marker')?.classList.contains('with-icon')).toBe(false);
  });

  it('keeps the icon slot in the tree even with nothing in it', async () => {
    const { root } = await render(FIXTURE());
    // A slot that is not rendered never fires `slotchange`, so an icon added
    // later would stay invisible for good.
    expect(items(root)[1].shadowRoot?.querySelector('slot[name="icon"]')).not.toBeNull();
  });

  it('re-reads the children on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE());

    items(root)[2].remove();
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    const remaining = items(root);
    expect(remaining[1].hasAttribute('last')).toBe(true);
    expect(part(remaining[1], 'connector')).toBeNull();
  });

  it('leaves a nested timeline its own entries', async () => {
    const { root } = await render(`
      <pf-timeline>
        <pf-timeline-item>
          <span slot="title">Outer</span>
          <pf-timeline>
            <pf-timeline-item><span slot="title">Inner</span></pf-timeline-item>
          </pf-timeline>
        </pf-timeline-item>
        <pf-timeline-item><span slot="title">Second</span></pf-timeline-item>
      </pf-timeline>`);

    const inner = root.querySelector('pf-timeline') as HTMLElement;
    const innerItem = inner.querySelector('pf-timeline-item') as HTMLElement;
    // Its own group made it the last entry; the outer one did not claim it.
    expect(innerItem.hasAttribute('last')).toBe(true);
    expect(items(root)[0].hasAttribute('last')).toBe(false);
  });
});
