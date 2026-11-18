import {
  expandableTreeValues,
  firstEnabledTreeValue,
  type FlatTreeNode,
  flattenVisibleTree,
  formatValueList,
  parseValueList,
  resolveTreeKey,
  type TreeNodeLike,
} from '@pitchfork-ui/core';
import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Method,
  Prop,
  State,
  Watch,
} from '@stencil/core';

/**
 * Distinguishes the ids a tree generates for its items. Not `useId`, which has
 * no equivalent here, and not a shadow-scoped literal either: these ids go on
 * *light-DOM* children, so they share the document's namespace.
 */
let instances = 0;

/** A `pf-tree-item` read the way core's rules need it. */
interface ItemNode extends TreeNodeLike {
  el: HTMLElement;
  children: ItemNode[];
}

/**
 * A tree over nested `pf-tree-item` children.
 *
 * Nesting rather than a `nodes` array, which is what a tree looks like in a
 * consumer's template anyway — and the labels are nodes, so they could not
 * cross the HTML boundary.
 *
 * The group owns what no single item can see: which one is selected, which
 * are open, the one tab stop, and the keyboard. Every rule the keyboard
 * follows is core's `resolveTreeKey`, so this and the React `TreeView` answer
 * the arrows identically.
 *
 * **The tree itself is the tab stop, not the items.** The ARIA tree pattern
 * allows either a roving tabindex or a managed `aria-activedescendant`, and
 * here only the second one works: measured in Chromium, a `tabindex="0"` host
 * slotted into another host's shadow tree is skipped by sequential navigation
 * entirely when the outer host's tabindex is negative — which is exactly a
 * nested `pf-tree-item` under a roving tabindex. So the tree takes the focus
 * and tracks the active item with an IDREF, which resolves because the items
 * are its own light-DOM descendants.
 *
 * The React `TreeView` makes every visible item a tab stop.
 *
 * @slot - the `pf-tree-item` children.
 */
@Component({
  tag: 'pf-tree-view',
  styleUrl: 'pf-tree-view.css',
  shadow: true,
})
export class PfTreeView {
  @Element() el!: HTMLElement;

  /** The selected item's value. */
  @Prop({ mutable: true, reflect: true }) value = '';

  /** The open branches, as one comma-separated string. */
  @Prop({ mutable: true, reflect: true }) expanded = '';

  /** The tree's accessible name. */
  @Prop() label?: string;

  /** Fires when the selection changes. */
  @Event({ bubbles: false }) pfSelectionChange!: EventEmitter<{ value: string }>;

  /** Fires when a branch opens or closes, with the open set. */
  @Event({ bubbles: false }) pfExpandedChange!: EventEmitter<{ value: string; values: string[] }>;

  /**
   * The item the keyboard is on, which is not always the selected one — the
   * arrows move it, Enter selects. Starts on the selection, so tabbing in
   * lands where the reader left off.
   */
  @State() activeValue = '';

  /** Distinguishes the ids this tree generates for its light-DOM items. */
  private uid = ++instances;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    if (!this.value) this.value = firstEnabledTreeValue(this.tree) ?? '';
    this.activeValue = this.value;
    this.sync();
  }

  componentDidLoad() {
    this.scheduleSync();
  }

  disconnectedCallback() {
    if (this.queuedFrame !== undefined) cancelAnimationFrame(this.queuedFrame);
    this.queuedFrame = undefined;
  }

  /** The frame a coalesced rescan is waiting for, while one is. */
  private queuedFrame?: number;

  /**
   * Rescans once in the next frame, however many times it is asked before
   * then.
   *
   * Loading a tree asks constantly: every item whose default slot is filled
   * -- which is every item, once the markup has a newline in it, because
   * whitespace is slotted text -- fires `slotchange` once it renders, and
   * forwards it as `pfTreeStructure`. Each used to rescan the whole tree, so
   * load was quadratic: a 1,000-item tree written one item per line rescanned
   * 1,005 times and spent 1,337 ms of its 1,387 ms load doing it, measured in
   * Chromium. Coalesced, it rescans a handful of times.
   *
   * Only the structural paths wait. A change a person or a consumer makes --
   * a key, a click, `value`, `expanded`, `refresh()` -- still rescans at
   * once, because the result is read straight back.
   */
  private scheduleSync() {
    if (this.queuedFrame !== undefined) return;
    this.queuedFrame = requestAnimationFrame(() => {
      this.queuedFrame = undefined;
      this.sync();
    });
  }

  @Watch('value')
  @Watch('expanded')
  handleStateChange() {
    this.sync();
  }

  /** Re-reads the tree, for a consumer who changed an item through a property. */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Opens every branch. */
  @Method()
  async expandAll() {
    this.setExpanded(expandableTreeValues(this.tree));
  }

  /** Closes every branch. */
  @Method()
  async collapseAll() {
    this.setExpanded([]);
  }

  /**
   * The nested items, as the tree core's rules walk.
   *
   * Each container's own `children`, never `querySelectorAll` filtered down to
   * them: the query returns every descendant, so reading a nested tree that
   * way visited each item once per ancestor.
   */
  private get tree(): ItemNode[] {
    const read = (container: HTMLElement): ItemNode[] =>
      (Array.from(container.children) as HTMLElement[])
        .filter((item) => item.tagName === 'PF-TREE-ITEM')
        .map((item) => ({
          el: item,
          value:
            (item as HTMLElement & { value?: string }).value ?? item.getAttribute('value') ?? '',
          disabled:
            (item as HTMLElement & { disabled?: boolean }).disabled ??
            item.hasAttribute('disabled'),
          children: read(item),
        }));

    return read(this.el);
  }

  private get openValues(): string[] {
    return parseValueList(this.expanded);
  }

  private get visible(): FlatTreeNode<ItemNode>[] {
    return flattenVisibleTree(this.tree, this.openValues);
  }

  /**
   * The active item's id as of the last rescan, which is what the host points
   * `aria-activedescendant` at. Kept rather than worked out in `render`, which
   * would read the whole tree a second time on every render.
   */
  @State() activeId?: string;

  /**
   * Pushes the tree's state onto the items: how deep each one is, whether it
   * is selected, open, or the one the keyboard is on — and an id, because the
   * active item is named by an IDREF from the host.
   */
  private sync() {
    const tree = this.tree;
    const open = new Set(this.openValues);
    let index = 0;

    const walk = (nodes: ItemNode[], level: number) => {
      for (const node of nodes) {
        const item = node.el as HTMLElement & {
          level: number;
          selected: boolean;
          expanded: boolean;
          hasChildren: boolean;
          active: boolean;
        };
        // The ids go on light-DOM children, so they share the document's
        // namespace with every other tree on the page.
        if (!node.el.id) node.el.id = `pf-tree-${this.uid}-item-${(index += 1)}`;
        item.level = level;
        item.selected = node.value === this.value;
        item.hasChildren = node.children.length > 0;
        item.expanded = node.children.length > 0 && open.has(node.value);
        item.active = node.value === this.activeValue;
        walk(node.children, level + 1);
      }
    };
    walk(tree, 1);

    /*
     * An item inside a closed branch cannot be the active one: the reader
     * cannot see it, and `aria-activedescendant` pointing at it would tell a
     * screen reader otherwise. Collapsing a branch therefore moves the
     * keyboard back out to it.
     */
    const visible = flattenVisibleTree(tree, [...open]);
    const active = visible.find((item) => item.node.value === this.activeValue);
    this.activeId = active?.node.el.id || undefined;
    if (visible.length === 0 || active) return;

    const fallback = visible.find((item) => item.node.value === this.value) ?? visible[0];
    this.activeValue = fallback.node.value;
    this.sync();
  }

  private setExpanded(next: string[]) {
    const value = formatValueList(next);
    if (value === this.expanded) return;

    this.expanded = value;
    this.sync();
    this.pfExpandedChange.emit({ value, values: next });
  }

  private toggle(value: string, open?: boolean) {
    const current = new Set(this.openValues);
    const shouldOpen = open ?? !current.has(value);

    if (shouldOpen) current.add(value);
    else current.delete(value);

    this.setExpanded(Array.from(current));
  }

  private select(value: string) {
    const node = this.visible.find((item) => item.node.value === value)?.node;
    if (!node || node.disabled) return;

    // The keyboard follows the selection, however it was made.
    this.activeValue = value;
    if (value === this.value) {
      this.sync();
      return;
    }

    this.value = value;
    this.sync();
    this.pfSelectionChange.emit({ value });
  }

  /** An item asking to be selected. The group decides. */
  @Listen('pfTreeSelect')
  handleSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    this.select(event.detail.value);
  }

  /** An item's twisty asking to open or close it. */
  @Listen('pfTreeToggle')
  handleToggle(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    this.toggle(event.detail.value);
  }

  /**
   * Every key rule is core's; this only carries the intent out. A key core
   * does not claim is left to the browser.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    const visible = this.visible;
    const currentIndex = visible.findIndex((item) => item.node.value === this.activeValue);
    const intent = resolveTreeKey(event.key, visible, currentIndex);
    if (!intent) return;

    event.preventDefault();

    if (intent.type === 'focus') {
      // The keyboard moves without any DOM focus moving: the tree keeps it.
      this.activeValue = intent.value;
      this.sync();
      return;
    }
    if (intent.type === 'expand' || intent.type === 'collapse') {
      this.toggle(intent.value, intent.type === 'expand');
      return;
    }

    // Activation both selects and toggles, as a click on each half would.
    this.select(intent.value);
    if (visible[currentIndex]?.hasChildren) this.toggle(intent.value);
  }

  /** An item's own slot changed, so the tree below it has moved. */
  @Listen('pfTreeStructure')
  handleStructureChange(event: CustomEvent<void>) {
    event.stopPropagation();
    this.scheduleSync();
  }

  render() {
    return (
      <Host role="tree" tabindex="0" aria-label={this.label} aria-activedescendant={this.activeId}>
        <slot onSlotchange={() => this.scheduleSync()} />
      </Host>
    );
  }
}
