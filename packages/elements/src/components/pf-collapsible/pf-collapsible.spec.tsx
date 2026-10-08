/**
 * The markup the fast project can see: both IDREFs, the disclosure state, and
 * which paths announce a change.
 *
 * Escape, `inert` refusing focus and the panel animation are in the browser
 * spec — the first reads `composedPath()`, and the other two need layout and
 * real focus.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-collapsible';

type Collapsible = HTMLElement & {
  open: boolean;
  show(): Promise<void>;
  hide(): Promise<void>;
};

const FIXTURE = (attrs = '') => `
  <pf-collapsible ${attrs}>
    <span slot="trigger">Advanced options</span>
    <p>Something to reveal.</p>
  </pf-collapsible>`;

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const trigger = (root: HTMLElement) => part(root, 'trigger') as HTMLButtonElement;

describe('pf-collapsible', () => {
  it('wires the header to its content region, and the region back', async () => {
    const { root } = await render(FIXTURE());

    const header = trigger(root);
    const content = part(root, 'content') as HTMLElement;
    expect(header.getAttribute('aria-controls')).toBe(content.id);
    expect(content.getAttribute('aria-labelledby')).toBe(header.id);
    expect(content.getAttribute('role')).toBe('region');
  });

  it('starts closed, and says so', async () => {
    const { root } = await render(FIXTURE());

    expect(trigger(root).getAttribute('aria-expanded')).toBe('false');
    expect(part(root, 'content')?.hasAttribute('inert')).toBe(true);
  });

  it('opens on a click, and closes on the next one', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const el = root as Collapsible;

    trigger(root).click();
    await waitForChanges();
    expect(el.open).toBe(true);
    expect(trigger(root).getAttribute('aria-expanded')).toBe('true');
    expect(part(root, 'content')?.hasAttribute('inert')).toBe(false);

    trigger(root).click();
    await waitForChanges();
    expect(el.open).toBe(false);
  });

  it('starts open when told to', async () => {
    const { root } = await render(FIXTURE('open'));

    expect(trigger(root).getAttribute('aria-expanded')).toBe('true');
    expect(part(root, 'content')?.hasAttribute('inert')).toBe(false);
  });

  /*
   * Announced from the watcher, so every path reports: the header, the
   * methods, and a consumer writing the prop. Announcing from the click
   * handler instead is the mistake pf-popover and pf-modal both made, and it
   * misses the last two.
   */
  it('announces a change from the header, a method and the prop alike', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const el = root as Collapsible;
    const changes: boolean[] = [];
    root.addEventListener('pfOpenChange', (event) =>
      changes.push((event as CustomEvent<{ open: boolean }>).detail.open),
    );

    trigger(root).click();
    await waitForChanges();
    await el.hide();
    await waitForChanges();
    await el.show();
    await waitForChanges();
    el.open = false;
    await waitForChanges();

    expect(changes).toEqual([true, false, true, false]);
  });

  it('stays quiet when set to the state it is already in', async () => {
    const { root, waitForChanges } = await render(FIXTURE('open'));
    const changes: boolean[] = [];
    root.addEventListener('pfOpenChange', () => changes.push(true));

    await (root as Collapsible).show();
    await waitForChanges();

    expect(changes).toEqual([]);
  });

  it('refuses everything while disabled', async () => {
    const { root, waitForChanges } = await render(FIXTURE('disabled'));
    const el = root as Collapsible;

    expect(trigger(root).hasAttribute('disabled')).toBe(true);
    trigger(root).click();
    await waitForChanges();
    expect(el.open).toBe(false);

    await el.show();
    await waitForChanges();
    expect(el.open).toBe(false);
  });

  /* A disabled disclosure that is already open can still be closed. */
  it('can be closed while disabled', async () => {
    const { root, waitForChanges } = await render(FIXTURE('open disabled'));
    const el = root as Collapsible;

    await el.hide();
    await waitForChanges();
    expect(el.open).toBe(false);
  });

  it('can drop the chevron', async () => {
    const { root: withChevron } = await render(FIXTURE());
    expect(part(withChevron, 'icon')).not.toBeNull();

    const { root: without } = await render(FIXTURE('show-chevron="false"'));
    expect(part(without, 'icon')).toBeNull();
  });
});
