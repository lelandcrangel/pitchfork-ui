import { Component, Element, h, Host, Prop, State } from '@stencil/core';

export type PfEmptyStateSize = 'sm' | 'md' | 'lg';

/**
 * What to show in place of content that is not there: an icon, a heading, a
 * line of explanation and something to do about it.
 *
 * The icon can be a name — `icon="folder-open"`, which renders a `pf-icon` —
 * or anything slotted into the `icon` slot, for an illustration this library
 * does not have. The slot wins where both are given.
 *
 * @slot - the heading.
 * @slot description - a line explaining the emptiness.
 * @slot action - what to do about it, usually a button.
 * @slot icon - an icon or illustration, in place of the `icon` name.
 * @part icon - the icon's box.
 * @part heading - the heading's box.
 * @part action - the box holding the action slot.
 */
@Component({
  tag: 'pf-empty-state',
  styleUrl: 'pf-empty-state.css',
  shadow: true,
})
export class PfEmptyState {
  @Element() el!: HTMLElement;

  /** Padding and type scale. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) size: PfEmptyStateSize = 'md';

  /** An icon name from the same registry as `pf-icon`. */
  @Prop() icon?: string;

  /**
   * Whether anything is slotted into the `icon` and `action` slots, which
   * decides whether their boxes are drawn at all.
   *
   * Asked in JS, because a wrapper around a slot cannot be collapsed from
   * CSS: `:not(:has(*))` never matches, since the `<slot>` is itself a child.
   * The description needs no box of its own, so it is styled through
   * `::slotted()` and collapses on its own — these two carry layout their
   * content cannot.
   */
  @State() hasIcon = false;
  @State() hasAction = false;

  /**
   * Read from the light DOM so first paint is right: the mock DOM never fires
   * `slotchange`, and a real one fires it after the first render.
   */
  componentWillLoad() {
    this.read();
  }

  private read = () => {
    const slotted = (name: string) =>
      Array.from(this.el.children).some((child) => child.getAttribute('slot') === name);

    this.hasIcon = slotted('icon');
    this.hasAction = slotted('action');
  };

  render() {
    /*
     * Both wrappers stay in the tree and are hidden when empty, rather than
     * being left out: a slot that is not rendered never fires `slotchange`, so
     * content added later would stay invisible for good.
     */
    const showIcon = this.hasIcon || Boolean(this.icon);

    return (
      <Host>
        <span class={{ icon: true, empty: !showIcon }} part="icon" aria-hidden="true">
          {/* The slot wins: a consumer who has slotted an illustration does
              not also want the named icon beside it. */}
          {this.icon && !this.hasIcon && <pf-icon name={this.icon}></pf-icon>}
          <slot name="icon" onSlotchange={this.read} />
        </span>

        <p class="heading" part="heading">
          <slot />
        </p>

        <slot name="description" />

        <span class={{ action: true, empty: !this.hasAction }} part="action">
          <slot name="action" onSlotchange={this.read} />
        </span>
      </Host>
    );
  }
}
