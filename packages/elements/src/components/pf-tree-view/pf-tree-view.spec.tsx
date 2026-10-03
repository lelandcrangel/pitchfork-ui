/**
 * The markup and the pushed-down state. The keyboard needs real focus and
 * `slotchange` never fires here, so both are in the browser spec.
 */
import { describe, expect, it, render } from '@stencil/vitest';
import './pf-tree-view';
import '../pf-tree-item/pf-tree-item';

const FIXTURE = (attrs = '') => `
  <pf-tree-view ${attrs}>
    <pf-tree-item value="src">
      <span slot="label">src</span>
      <pf-tree-item value="index.ts"><span slot="label">index.ts</span></pf-tree-item>
      <pf-tree-item value="components">
        <span slot="label">components</span>
        <pf-tree-item value="Button.tsx"><span slot="label">Button.tsx</span></pf-tree-item>
      </pf-tree-item>
    </pf-tree-item>
    <pf-tree-item value="package.json" disabled>
      <span slot="label">package.json</span>
    </pf-tree-item>
  </pf-tree-view>`;

type Tree = HTMLElement & {
  value: string;
  expanded: string;
  expandAll(): Promise<void>;
  collapseAll(): Promise<void>;
  refresh(): Promise<void>;
};

const item = (root: HTMLElement, value: string) =>
  root.querySelector(`pf-tree-item[value="${value}"]`) as HTMLElement;
const items = (root: HTMLElement) => Array.from(root.querySelectorAll('pf-tree-item'));
const part = (host: Element, name: string) =>
  host.shadowRoot?.querySelector(`[part="${name}"]`) as HTMLElement | null;
/* The tree is the tab stop; the active item is named by an IDREF instead. */
const activeValue = (root: HTMLElement) =>
  items(root)
    .find((node) => node.hasAttribute('active'))
    ?.getAttribute('value') ?? null;
const activeDescendant = (root: HTMLElement) => {
  const id = root.getAttribute('aria-activedescendant');
  return id ? (root.querySelector(`#${id}`)?.getAttribute('value') ?? null) : null;
};

describe('pf-tree-view', () => {
  it('is a tree of treeitems, each knowing how deep it is', async () => {
    const { root } = await render(FIXTURE());

    expect(root.getAttribute('role')).toBe('tree');
    expect(items(root).every((node) => node.getAttribute('role') === 'treeitem')).toBe(true);
    expect(item(root, 'src').getAttribute('aria-level')).toBe('1');
    expect(item(root, 'index.ts').getAttribute('aria-level')).toBe('2');
    expect(item(root, 'Button.tsx').getAttribute('aria-level')).toBe('3');
  });

  it('groups each branch’s children, which is what makes it a tree', async () => {
    const { root } = await render(FIXTURE());
    expect(part(item(root, 'src'), 'children')?.getAttribute('role')).toBe('group');
  });

  /* Core's rule: the first item that is not disabled. */
  it('selects the first selectable item when told nothing', async () => {
    const { root } = await render(FIXTURE());
    expect((root as Tree).value).toBe('src');
    expect(item(root, 'src').getAttribute('aria-selected')).toBe('true');
  });

  it('takes a selection it is given', async () => {
    const { root } = await render(FIXTURE('value="index.ts" expanded="src"'));
    expect(item(root, 'index.ts').getAttribute('aria-selected')).toBe('true');
    expect(item(root, 'src').getAttribute('aria-selected')).toBe('false');
  });

  it('opens the branches named in expanded, and only those', async () => {
    const { root } = await render(FIXTURE('expanded="src"'));

    expect(item(root, 'src').hasAttribute('expanded')).toBe(true);
    expect(item(root, 'components').hasAttribute('expanded')).toBe(false);
    expect(part(item(root, 'src'), 'children')?.hasAttribute('hidden')).toBe(false);
    expect(part(item(root, 'components'), 'children')?.hasAttribute('hidden')).toBe(true);
  });

  it('says which items can be opened, and which cannot', async () => {
    const { root } = await render(FIXTURE());

    expect(item(root, 'src').getAttribute('aria-expanded')).toBe('false');
    expect(item(root, 'package.json').getAttribute('aria-expanded')).toBeNull();
    expect(item(root, 'src').hasAttribute('has-children')).toBe(true);
    expect(item(root, 'package.json').hasAttribute('has-children')).toBe(false);
  });

  /*
   * The tree itself is the one tab stop, and the keyboard's place is named by
   * an IDREF rather than carried by a tabindex — because a nested host cannot
   * take one at all: measured in Chromium, a `tabindex="0"` host slotted into
   * another host's shadow tree is skipped by sequential navigation entirely
   * when the outer host's tabindex is negative.
   */
  it('is the tab stop itself, with the items out of the order', async () => {
    const { root } = await render(FIXTURE('value="index.ts" expanded="src"'));

    expect(root.getAttribute('tabindex')).toBe('0');
    expect(items(root).some((node) => node.getAttribute('tabindex') === '0')).toBe(false);
  });

  it('starts the keyboard on the selected item', async () => {
    const { root } = await render(FIXTURE('value="index.ts" expanded="src"'));

    expect(activeValue(root)).toBe('index.ts');
    expect(activeDescendant(root)).toBe('index.ts');
  });

  /*
   * An item inside a closed branch cannot be the active one: the reader cannot
   * see it, and `aria-activedescendant` pointing at it would tell a screen
   * reader otherwise.
   */
  it('never points at an item inside a closed branch', async () => {
    const { root } = await render(FIXTURE('value="index.ts"'));

    expect(activeValue(root)).toBe('src');
    expect(activeDescendant(root)).toBe('src');
  });

  it('gives every item an id to be pointed at', async () => {
    const { root } = await render(FIXTURE());
    expect(items(root).every((node) => node.id !== '')).toBe(true);
  });

  it('keeps an id a consumer set', async () => {
    const { root } = await render(`
      <pf-tree-view>
        <pf-tree-item id="mine" value="a"><span slot="label">A</span></pf-tree-item>
      </pf-tree-view>`);

    expect(root.getAttribute('aria-activedescendant')).toBe('mine');
  });

  it('selects on a click, and reports it once', async () => {
    const { root, waitForChanges } = await render(FIXTURE('expanded="src"'));
    const changes: string[] = [];
    root.addEventListener('pfChange', (event) =>
      changes.push((event as CustomEvent<{ value: string }>).detail.value),
    );

    (part(item(root, 'index.ts'), 'row') as HTMLElement).click();
    await waitForChanges();

    expect((root as Tree).value).toBe('index.ts');
    expect(changes).toEqual(['index.ts']);
  });

  it('refuses to select a disabled item', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const changes: string[] = [];
    root.addEventListener('pfChange', () => changes.push('x'));

    (part(item(root, 'package.json'), 'row') as HTMLElement).click();
    await waitForChanges();

    expect((root as Tree).value).toBe('src');
    expect(changes).toEqual([]);
  });

  /* The twisty opens the branch without also selecting the item. */
  it('opens a branch from the twisty alone', async () => {
    const { root, waitForChanges } = await render(FIXTURE('value="package.json"'));
    const expansions: string[][] = [];
    root.addEventListener('pfExpandedChange', (event) =>
      expansions.push((event as CustomEvent<{ values: string[] }>).detail.values),
    );

    (part(item(root, 'src'), 'toggle') as HTMLButtonElement).click();
    await waitForChanges();

    expect((root as Tree).expanded).toBe('src');
    expect((root as Tree).value).toBe('package.json');
    expect(expansions).toEqual([['src']]);
  });

  it('closes it again on the next click', async () => {
    const { root, waitForChanges } = await render(FIXTURE('expanded="src"'));

    (part(item(root, 'src'), 'toggle') as HTMLButtonElement).click();
    await waitForChanges();

    expect((root as Tree).expanded).toBe('');
  });

  it('opens and closes every branch on request', async () => {
    const { root, waitForChanges } = await render(FIXTURE());
    const tree = root as Tree;

    await tree.expandAll();
    await waitForChanges();
    expect(tree.expanded).toBe('src,components');

    await tree.collapseAll();
    await waitForChanges();
    expect(tree.expanded).toBe('');
  });

  it('offers no twisty on an item with nothing in it', async () => {
    const { root } = await render(FIXTURE());
    expect(part(item(root, 'package.json'), 'toggle')).toBeNull();
    expect(part(item(root, 'src'), 'toggle')).not.toBeNull();
  });

  it('re-reads the tree on refresh()', async () => {
    const { root, waitForChanges } = await render(FIXTURE('value="index.ts" expanded="src"'));
    expect(activeValue(root)).toBe('index.ts');

    item(root, 'index.ts').remove();
    await (root as Tree).refresh();
    await waitForChanges();

    // The item the keyboard was on is gone, so it falls back to a visible one.
    expect(activeValue(root)).toBe('src');
  });

  it('leaves a nested tree its own items', async () => {
    const { root } = await render(`
      <pf-tree-view value="outer">
        <pf-tree-item value="outer">
          <span slot="label">Outer</span>
          <pf-tree-view value="inner">
            <pf-tree-item value="inner"><span slot="label">Inner</span></pf-tree-item>
          </pf-tree-view>
        </pf-tree-item>
      </pf-tree-view>`);

    // The outer tree did not claim the nested item: it is level 1 of its own.
    expect(item(root, 'inner').getAttribute('aria-level')).toBe('1');
    expect(item(root, 'inner').getAttribute('aria-selected')).toBe('true');
    expect(item(root, 'outer').hasAttribute('has-children')).toBe(false);
  });
});
