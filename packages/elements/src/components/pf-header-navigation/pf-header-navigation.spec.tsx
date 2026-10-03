/**
 * The landmark, the list semantics, the one-current rule and the two boxes
 * that collapse when nothing is slotted into them. `slotchange` is the one
 * thing the fast project cannot see, and that is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-header-navigation';
import '../pf-nav-item/pf-nav-item';

const FIXTURE = (attrs = '', items = '', extra = '') => `
  <pf-header-navigation ${attrs}>
    ${extra}
    <pf-nav-item href="/">Home</pf-nav-item>
    <pf-nav-item href="/about" ${items}>About</pf-nav-item>
    <pf-nav-item href="/contact">Contact</pf-nav-item>
  </pf-header-navigation>`;

const items = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-nav-item'));
const link = (item: Element) => item.shadowRoot?.querySelector('[part="link"]') as HTMLElement;
const part = (root: HTMLElement, name: string) =>
  root.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const currentLabels = (root: HTMLElement) =>
  items(root)
    .filter((item) => link(item)?.getAttribute('aria-current') === 'page')
    .map((item) => item.textContent?.trim());

describe('pf-header-navigation', () => {
  /*
   * The landmark is the `<nav>` in the shadow root, not the host: an element
   * cannot know whether it is the page's `<header>`, and a second banner
   * landmark is a defect rather than a decoration.
   */
  it('renders a navigation landmark and no banner', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBeNull();
    const nav = part(root, 'nav');
    expect(nav.tagName.toLowerCase()).toBe('nav');
    expect(nav.getAttribute('aria-label')).toBe('Header navigation');
  });

  it('takes a name of its own', async () => {
    const { root } = await render(FIXTURE('label="Main"'));
    expect(part(root, 'nav').getAttribute('aria-label')).toBe('Main');
  });

  it('is a list of list items', async () => {
    const { root } = await render(FIXTURE());

    expect(part(root, 'list').tagName.toLowerCase()).toBe('ul');
    expect(items(root).every((item) => item.getAttribute('role') === 'listitem')).toBe(true);
  });

  it('renders a link for an item with an href', async () => {
    const { root } = await render(FIXTURE());
    const first = link(items(root)[0]);

    expect(first.tagName.toLowerCase()).toBe('a');
    expect(first.getAttribute('href')).toBe('/');
  });

  /*
   * No `href` is how a framework's own router is used: the consumer slots
   * their `<a routerLink>` in and this renders only the box around it.
   */
  it('renders a plain box for an item with no href', async () => {
    const { root } = await render(
      '<pf-header-navigation><pf-nav-item><a href="/x">X</a></pf-nav-item></pf-header-navigation>',
    );

    expect(link(items(root)[0]).tagName.toLowerCase()).toBe('span');
  });

  it('marks nothing current until an item says so', async () => {
    const { root } = await render(FIXTURE());
    expect(currentLabels(root)).toEqual([]);
  });

  it('marks the item that says it is current', async () => {
    const { root } = await render(FIXTURE('', 'current'));

    expect(currentLabels(root)).toEqual(['About']);
    expect(items(root)[1].hasAttribute('current-page')).toBe(true);
  });

  /*
   * `aria-current="page"` names one page. Two marked items would tell a
   * reader they were on two at once, which is the defect core's
   * `resolveCurrentNavItem` exists to prevent — and the React
   * `HeaderNavigation` had it.
   */
  it('marks only the first of two items that both say so', async () => {
    const { root } = await render(`
      <pf-header-navigation>
        <pf-nav-item href="/" current>Home</pf-nav-item>
        <pf-nav-item href="/about" current>About</pf-nav-item>
      </pf-header-navigation>`);

    expect(currentLabels(root)).toEqual(['Home']);
  });

  /* The answer never goes back onto the ask; see `pf-breadcrumb`. */
  it('leaves the consumer’s current attribute alone', async () => {
    const { root } = await render(FIXTURE('', 'current'));

    expect(items(root).map((item) => item.hasAttribute('current'))).toEqual([false, true, false]);
  });

  it('pushes its orientation onto every item', async () => {
    const { root } = await render(FIXTURE());

    expect(items(root).every((item) => item.getAttribute('orientation') === 'horizontal')).toBe(
      true,
    );
  });

  /*
   * The two boxes are grid items, so an empty one still takes a column and a
   * gap. A wrapper around a slot cannot be collapsed from CSS, so the class
   * is the only way to know.
   */
  it('collapses the brand and actions boxes when nothing is slotted', async () => {
    const { root } = await render(FIXTURE());

    expect(part(root, 'brand').className).toContain('empty');
    expect(part(root, 'actions').className).toContain('empty');
  });

  it('draws them when something is', async () => {
    const { root } = await render(
      FIXTURE('', '', '<span slot="brand">Acme</span><button slot="actions">Sign in</button>'),
    );

    expect(part(root, 'brand').className).not.toContain('empty');
    expect(part(root, 'actions').className).not.toContain('empty');
  });

  /* The slots stay in the tree either way, or content added later never shows. */
  it('keeps both slots rendered while their boxes are hidden', async () => {
    const { root } = await render(FIXTURE());

    expect(root.shadowRoot?.querySelector('slot[name="brand"]')).toBeTruthy();
    expect(root.shadowRoot?.querySelector('slot[name="actions"]')).toBeTruthy();
  });

  /* A nested navigation owns its own items. */
  it('ignores the items of a navigation nested inside it', async () => {
    const { root } = await render(`
      <pf-header-navigation>
        <pf-nav-item href="/">Home</pf-nav-item>
        <div>
          <pf-header-navigation>
            <pf-nav-item href="/deep" current>Deep</pf-nav-item>
          </pf-header-navigation>
        </div>
      </pf-header-navigation>`);

    const outer = items(root).find((item) => item.textContent?.trim() === 'Home');
    expect(outer?.hasAttribute('current-page')).toBe(false);
  });

  it('refreshes when a consumer marks an item through its property', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const node = items(root)[2] as HTMLElement & { current: boolean };

    node.current = true;
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(currentLabels(root)).toEqual(['Contact']);
  });
});

describe('pf-nav-item', () => {
  /*
   * An anchor has no disabled state: `aria-disabled` alone leaves it
   * focusable and clickable, so a disabled item renders no anchor at all.
   */
  it('renders no anchor when it is disabled', async () => {
    const { root } = await render(
      '<pf-header-navigation><pf-nav-item href="/x" disabled>X</pf-nav-item></pf-header-navigation>',
    );
    const box = link(items(root)[0]);

    expect(box.tagName.toLowerCase()).toBe('span');
    expect(box.getAttribute('aria-disabled')).toBe('true');
    expect(box.hasAttribute('href')).toBe(false);
  });

  it('passes target and rel to the anchor', async () => {
    const { root } = await render(
      '<pf-header-navigation><pf-nav-item href="/x" target="_blank" rel="noopener">X</pf-nav-item></pf-header-navigation>',
    );
    const anchor = link(items(root)[0]);

    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toBe('noopener');
  });

  it('renders the icon and badge slots', async () => {
    const { root } = await render(
      '<pf-header-navigation><pf-nav-item href="/x">X</pf-nav-item></pf-header-navigation>',
    );
    const shadow = items(root)[0].shadowRoot;

    expect(shadow?.querySelector('slot[name="icon"]')).toBeTruthy();
    expect(shadow?.querySelector('slot[name="badge"]')).toBeTruthy();
  });
});
