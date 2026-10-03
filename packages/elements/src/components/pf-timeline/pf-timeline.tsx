import { Component, Element, h, Host, Method, Prop, Watch } from '@stencil/core';

/**
 * A vertical timeline over `pf-timeline-item` children.
 *
 * The group owns the one thing an entry cannot see: whether it is the last,
 * which decides both the connector running down to the next entry and the
 * space below the content.
 *
 * @slot - the `pf-timeline-item` children.
 */
@Component({
  tag: 'pf-timeline',
  styleUrl: 'pf-timeline.css',
  shadow: true,
})
export class PfTimeline {
  @Element() el!: HTMLElement;

  /**
   * The timeline's accessible name. A list of entries is worth naming, and a
   * consumer can only do it from out here.
   */
  @Prop() label?: string;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Watch('label')
  handleLabelChange() {
    this.sync();
  }

  /** Re-reads the children, for a consumer who moved them imperatively. */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested timeline owns its own entries. */
  private get items(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-timeline-item')).filter(
      (item) => item.parentElement === this.el,
    );
  }

  private sync() {
    const items = this.items;
    for (const [index, item] of items.entries()) {
      (item as HTMLElement & { last: boolean }).last = index === items.length - 1;
    }
  }

  render() {
    return (
      <Host role="list" aria-label={this.label}>
        <slot onSlotchange={() => this.refresh()} />
      </Host>
    );
  }
}
