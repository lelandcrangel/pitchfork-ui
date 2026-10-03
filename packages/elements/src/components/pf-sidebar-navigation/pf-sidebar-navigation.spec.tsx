/**
 * The landmark, the sections, the one-current rule across them and the two
 * boxes that would otherwise draw a rule across an empty sidebar.
 * `slotchange` — and with it the structure event a section emits, since
 * `slotchange` is not composed — is in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-sidebar-navigation';
import '../pf-nav-section/pf-nav-section';
import '../pf-nav-item/pf-nav-item';

const FIXTURE = (attrs = '', marks = ['', ''], extra = '') => `
  <pf-sidebar-navigation ${attrs}>
    ${extra}
    <pf-nav-section>
      <span slot="title">Main</span>
      <pf-nav-item href="/" ${marks[0]}>Home</pf-nav-item>
      <pf-nav-item href="/reports">Reports</pf-nav-item>
    </pf-nav-section>
    <pf-nav-section>
      <span slot="title">Admin</span>
      <pf-nav-item href="/users" ${marks[1]}>Users</pf-nav-item>
    </pf-nav-section>
  </pf-sidebar-navigation>`;

const items = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-nav-item'));
const sections = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-nav-section'));
const link = (item: Element) => item.shadowRoot?.querySelector('[part="link"]') as HTMLElement;
const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement;
const currentLabels = (root: HTMLElement) =>
  items(root)
    .filter((item) => link(item)?.getAttribute('aria-current') === 'page')
    .map((item) => item.textContent?.trim());

describe('pf-sidebar-navigation', () => {
  it('renders one navigation landmark and no region of its own', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBeNull();
    expect(root.shadowRoot?.querySelectorAll('nav')).toHaveLength(1);
    expect(part(root, 'nav').getAttribute('aria-label')).toBe('Sidebar navigation');
  });

  it('takes a name of its own', async () => {
    const { root } = await render(FIXTURE('label="Workspace"'));
    expect(part(root, 'nav').getAttribute('aria-label')).toBe('Workspace');
  });

  /*
   * The sections own the lists, not the navigation: a `<ul>` around the
   * sections would be a list whose children were not items.
   */
  it('leaves the lists to the sections', async () => {
    const { root } = await render(FIXTURE());

    expect(root.shadowRoot?.querySelector('ul')).toBeNull();
    expect(sections(root).every((section) => part(section, 'list').tagName === 'UL')).toBe(true);
    expect(items(root).every((item) => item.getAttribute('role') === 'listitem')).toBe(true);
  });

  /* A same-root IDREF, which is the kind that resolves. */
  it('names each list with its own title', async () => {
    const { root } = await render(FIXTURE());
    const section = sections(root)[0];
    const list = part(section, 'list');

    expect(list.getAttribute('aria-labelledby')).toBe('title');
    expect(section.shadowRoot?.getElementById('title')?.getAttribute('part')).toBe('title');
  });

  it('names nothing when a section has no title', async () => {
    const { root } = await render(`
      <pf-sidebar-navigation>
        <pf-nav-section><pf-nav-item href="/">Home</pf-nav-item></pf-nav-section>
      </pf-sidebar-navigation>`);
    const section = sections(root)[0];

    expect(part(section, 'list').hasAttribute('aria-labelledby')).toBe(false);
    expect(part(section, 'title').className).toContain('empty');
    expect(section.shadowRoot?.querySelector('slot[name="title"]')).toBeTruthy();
  });

  it('marks nothing current until an item says so', async () => {
    const { root } = await render(FIXTURE());
    expect(currentLabels(root)).toEqual([]);
  });

  it('marks an item inside a section', async () => {
    const { root } = await render(FIXTURE('', ['', 'current']));
    expect(currentLabels(root)).toEqual(['Users']);
  });

  /*
   * Across sections, not within one: two marked sections would tell a reader
   * they were on two pages. The React `SidebarNavigation` had exactly this.
   */
  it('marks only the first across every section', async () => {
    const { root } = await render(FIXTURE('', ['current', 'current']));
    expect(currentLabels(root)).toEqual(['Home']);
  });

  it('pushes a vertical orientation onto every item', async () => {
    const { root } = await render(FIXTURE());

    expect(items(root).every((item) => item.getAttribute('orientation') === 'vertical')).toBe(true);
  });

  it('leaves the consumer’s current attribute alone', async () => {
    const { root } = await render(FIXTURE('', ['', 'current']));

    expect(items(root).map((item) => item.hasAttribute('current'))).toEqual([false, false, true]);
  });

  it('collapses the header and footer boxes when nothing is slotted', async () => {
    const { root } = await render(FIXTURE());

    expect(part(root, 'header').className).toContain('empty');
    expect(part(root, 'footer').className).toContain('empty');
    expect(root.shadowRoot?.querySelector('slot[name="header"]')).toBeTruthy();
    expect(root.shadowRoot?.querySelector('slot[name="footer"]')).toBeTruthy();
  });

  it('draws them when something is', async () => {
    const { root } = await render(
      FIXTURE('', ['', ''], '<span slot="header">Acme</span><span slot="footer">v2</span>'),
    );

    expect(part(root, 'header').className).not.toContain('empty');
    expect(part(root, 'footer').className).not.toContain('empty');
  });

  /* A navigation nested inside this one keeps its own items. */
  it('ignores the items of a navigation nested inside it', async () => {
    const { root } = await render(`
      <pf-sidebar-navigation>
        <pf-nav-section>
          <pf-nav-item href="/">Home</pf-nav-item>
        </pf-nav-section>
        <pf-header-navigation>
          <pf-nav-item href="/deep">Deep</pf-nav-item>
        </pf-header-navigation>
      </pf-sidebar-navigation>`);

    const own = items(root).find((item) => item.textContent?.trim() === 'Home');
    const deep = items(root).find((item) => item.textContent?.trim() === 'Deep');

    expect(own?.getAttribute('orientation')).toBe('vertical');
    expect(deep).toBeTruthy();
    expect(deep?.getAttribute('orientation')).toBe('horizontal');
  });

  it('refreshes when a consumer marks an item through its property', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const node = items(root)[1] as HTMLElement & { current: boolean };

    node.current = true;
    await (root as HTMLElement & { refresh(): Promise<void> }).refresh();
    await waitForChanges();

    expect(currentLabels(root)).toEqual(['Reports']);
  });
});
