/**
 * The markup, and which boxes are drawn. `slotchange` — an icon or an action
 * arriving after mount — is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-empty-state';

const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
const isEmpty = (root: HTMLElement, name: string) =>
  part(root, name)?.classList.contains('empty') ?? null;

describe('pf-empty-state', () => {
  it('renders the heading from the default slot', async () => {
    const { root } = await render(`<pf-empty-state>No results</pf-empty-state>`);

    expect(part(root, 'heading')?.tagName.toLowerCase()).toBe('p');
    expect(root.textContent?.trim()).toBe('No results');
  });

  it('renders an icon from a name', async () => {
    const { root } = await render(
      `<pf-empty-state icon="folder-open">Nothing here</pf-empty-state>`,
    );

    expect(isEmpty(root, 'icon')).toBe(false);
    expect(part(root, 'icon')?.querySelector('pf-icon')?.getAttribute('name')).toBe('folder-open');
    expect(part(root, 'icon')?.getAttribute('aria-hidden')).toBe('true');
  });

  /* A consumer who slotted an illustration does not also want the named icon. */
  it('lets a slotted icon win over the name', async () => {
    const { root } = await render(`
      <pf-empty-state icon="folder-open">
        <img slot="icon" src="empty.svg" alt="" />
        Nothing here
      </pf-empty-state>`);

    expect(isEmpty(root, 'icon')).toBe(false);
    expect(part(root, 'icon')?.querySelector('pf-icon')).toBeNull();
  });

  /*
   * Hidden rather than left out: a slot that is not rendered never fires
   * `slotchange`, so an icon added later would stay invisible for good.
   */
  it('keeps the icon and action slots in the tree, and hides their boxes', async () => {
    const { root } = await render(`<pf-empty-state>No results</pf-empty-state>`);

    expect(isEmpty(root, 'icon')).toBe(true);
    expect(isEmpty(root, 'action')).toBe(true);
    expect(root.shadowRoot?.querySelector('slot[name="icon"]')).not.toBeNull();
    expect(root.shadowRoot?.querySelector('slot[name="action"]')).not.toBeNull();
  });

  it('draws the action box when something is slotted into it', async () => {
    const { root } = await render(`
      <pf-empty-state>
        No results
        <button slot="action" type="button">Clear filters</button>
      </pf-empty-state>`);

    expect(isEmpty(root, 'action')).toBe(false);
  });

  /*
   * The description has no box at all — an unassigned slot generates nothing,
   * where an empty wrapper would leave its own gap behind.
   */
  it('gives the description no wrapper', async () => {
    const { root } = await render(`
      <pf-empty-state>
        No results
        <span slot="description">Try a different search.</span>
      </pf-empty-state>`);

    expect(root.shadowRoot?.querySelector('[part="description"]')).toBeNull();
    expect(root.shadowRoot?.querySelector('slot[name="description"]')).not.toBeNull();
  });

  it('defaults to the md size and takes the others', async () => {
    const { root: md } = await render(`<pf-empty-state>Empty</pf-empty-state>`);
    expect(md.getAttribute('size')).toBe('md');

    const { root: lg } = await render(`<pf-empty-state size="lg">Empty</pf-empty-state>`);
    expect(lg.getAttribute('size')).toBe('lg');
  });
});
