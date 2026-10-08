import { Component, Element, Event, EventEmitter, h, Host, Prop, State } from '@stencil/core';

/**
 * One item in a `pf-tree-view`, with its own items nested inside it.
 *
 * The host is the `treeitem`, and it is never focused: the tree keeps the
 * focus and names the active item with `aria-activedescendant`, because a
 * nested host cannot take a roving tabindex at all — measured, and explained
 * on `pf-tree-view`. So the row inside is a plain box rather than a button,
 * and the twisty is the only focusable thing in here, kept out of the tab
 * order.
 *
 * `level`, `selected`, `expanded` and `hasChildren` are the group's to set:
 * only it can see the whole tree.
 *
 * @slot label - the item's label.
 * @slot badge - small trailing content, a count or a status.
 * @slot - the nested `pf-tree-item` children.
 * @part row - the item's own row, without its children.
 * @part toggle - the twisty, on an item that has children.
 * @part label - the label's box.
 * @part children - the box holding the nested items.
 */
@Component({
  tag: 'pf-tree-item',
  styleUrl: 'pf-tree-item.css',
  shadow: true,
})
export class PfTreeItem {
  @Element() el!: HTMLElement;

  /**
   * Identifies the item in the tree's selection and open set.
   *
   * Reflected because the generated bindings set props as properties, so
   * without it a consumer selecting `pf-tree-item[value="..."]` finds
   * nothing. The tree reads the property.
   */
  @Prop({ reflect: true }) value = '';

  /** Reflected; the stylesheet and the tree's own filtering both read it. */
  @Prop({ reflect: true }) disabled = false;

  /** An icon name from the same registry as `pf-icon`. */
  @Prop() icon?: string;

  /** Set by the tree: how deep this item sits, counting from 1. */
  @Prop({ mutable: true }) level = 1;

  /** Set by the tree. Reflected, so the stylesheet can mark the item. */
  @Prop({ mutable: true, reflect: true }) selected = false;

  /** Set by the tree: whether this branch is open. Reflected. */
  @Prop({ mutable: true, reflect: true }) expanded = false;

  /** Set by the tree: whether there is anything to open. Reflected. */
  @Prop({ mutable: true, reflect: true }) hasChildren = false;

  /**
   * Set by the tree: the item the keyboard is on, which is not always the
   * selected one. Reflected, because the ring is drawn from it.
   */
  @Prop({ mutable: true, reflect: true }) active = false;

  /** Asks the tree to select this item. The tree decides. */
  @Event() pfTreeSelect!: EventEmitter<{ value: string }>;

  /** Asks the tree to open or close this branch. */
  @Event() pfTreeToggle!: EventEmitter<{ value: string }>;

  /**
   * Tells the tree that the items inside this one have changed.
   *
   * `slotchange` does not cross a shadow boundary — it is not composed — so a
   * tree cannot hear its grandchildren arrive. Without this, an item appended
   * to a branch is never given a level, an id or a place in the keyboard
   * order; a browser test adds one.
   */
  @Event() pfTreeStructure!: EventEmitter<void>;

  /** Whether anything is slotted into the badge, which carries layout. */
  @State() hasBadge = false;

  /** Read from the light DOM, so first paint is right without `slotchange`. */
  componentWillLoad() {
    this.read();
  }

  private read = () => {
    this.hasBadge = Array.from(this.el.children).some(
      (child) => child.getAttribute('slot') === 'badge',
    );
  };

  private onRowClick = () => {
    if (this.disabled) return;
    this.pfTreeSelect.emit({ value: this.value });
  };

  private onToggleClick = (event: MouseEvent) => {
    // The twisty opens the branch without also selecting the item.
    event.stopPropagation();
    this.pfTreeToggle.emit({ value: this.value });
  };

  render() {
    return (
      <Host
        role="treeitem"
        aria-level={String(this.level)}
        aria-selected={this.selected ? 'true' : 'false'}
        aria-expanded={this.hasChildren ? (this.expanded ? 'true' : 'false') : null}
        aria-disabled={this.disabled ? 'true' : null}
      >
        {/*
          A click surface rather than a button: the host is the treeitem, and
          the tree holds the keys — a second focusable thing in here would be
          a tab stop inside a treeitem, which the pattern does not have.
        */}
        <div class="row" part="row" onClick={this.onRowClick}>
          <span class="twisty" aria-hidden="true">
            {this.hasChildren && (
              <button
                type="button"
                class="toggle"
                part="toggle"
                tabindex="-1"
                onClick={this.onToggleClick}
              >
                {this.expanded ? '▾' : '▸'}
              </button>
            )}
          </span>

          {this.icon && <pf-icon class="icon" name={this.icon} aria-hidden="true"></pf-icon>}

          <span class="label" part="label">
            <slot name="label" />
          </span>

          <span class={{ badge: true, empty: !this.hasBadge }}>
            <slot name="badge" onSlotchange={this.read} />
          </span>
        </div>

        {/*
          The nested items stay in the tree when the branch is closed and are
          hidden instead: a slot that is not rendered never fires `slotchange`,
          so an item added to a closed branch would stay invisible for good.
          `role="group"` is what makes the nesting a tree to a screen reader.
        */}
        <div class="children" part="children" role="group" hidden={!this.expanded}>
          <slot onSlotchange={() => this.pfTreeStructure.emit()} />
        </div>
      </Host>
    );
  }
}
