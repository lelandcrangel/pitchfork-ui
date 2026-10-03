import { avatarGroupLabel, splitAvatarGroup } from '@pitchfork-ui/core';
import { Component, Element, h, Host, Method, Prop, State, Watch } from '@stencil/core';

import type { PfAvatarSize } from '../pf-avatar/pf-avatar';

/**
 * A stack of overlapping `pf-avatar` children, with a `+N` chip for the ones
 * that did not fit.
 *
 * Children rather than an array of people, as everywhere else — a consumer
 * loops in their own template, and each avatar keeps its own `src`, `name` and
 * `status`.
 *
 * The chip is a `pf-avatar` of its own, in the shadow root: it needs an
 * avatar's shape, size and ring, and reusing the element is how it gets them
 * without a second copy of all three. Its colours come through the
 * `--pf-avatar-*` properties the avatar already reads, which inherit through
 * the shadow boundary.
 *
 * @slot - the `pf-avatar` children.
 * @part overflow - the `+N` chip, when something did not fit.
 */
@Component({
  tag: 'pf-avatar-group',
  styleUrl: 'pf-avatar-group.css',
  shadow: true,
})
export class PfAvatarGroup {
  @Element() el!: HTMLElement;

  /** How many avatars to show before collapsing the rest into the chip. */
  @Prop() max = 5;

  /** Applied to every avatar in the group. Reflected, and pushed down. */
  @Prop({ reflect: true }) size: PfAvatarSize = 'md';

  /**
   * The group's real size, for a group that knows how many people there are
   * without being handed an avatar for each: five faces and `+35`.
   */
  @Prop() total?: number;

  /** Overrides the generated name, which counts the people in the group. */
  @Prop() label?: string;

  /** How many did not fit, which is what the chip says. */
  @State() overflow = 0;

  /** How many the group counts, which is what its name says. */
  @State() counted = 0;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Watch('max')
  @Watch('size')
  @Watch('total')
  handleStateChange() {
    this.sync();
  }

  /** Re-reads the children, for a consumer who changed one through a property. */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested group owns its own avatars. */
  private get avatars(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-avatar')).filter(
      (avatar) => avatar.parentElement === this.el,
    );
  }

  private sync() {
    const avatars = this.avatars;
    const split = splitAvatarGroup(avatars.length, Number(this.max), this.total);

    for (const [index, avatar] of avatars.entries()) {
      (avatar as HTMLElement & { size: PfAvatarSize }).size = this.size;

      /*
       * A data attribute of the group's own rather than `hidden`: `hidden` is
       * the consumer's to set, and overwriting it would lose an avatar they
       * had hidden themselves. This says "the group collapsed you", which is
       * a different thing, and the stylesheet selects on it.
       */
      if (index < split.shown) avatar.removeAttribute('data-pf-overflow');
      else avatar.setAttribute('data-pf-overflow', '');

      // Earlier avatars stack above later ones, and the chip sits under all
      // of them -- so the overlap reads as a stack rather than a ribbon.
      avatar.style.zIndex = index < split.shown ? `${split.shown - index}` : '';
    }

    this.overflow = split.overflow;
    this.counted = split.total;
  }

  render() {
    return (
      <Host role="group" aria-label={this.label ?? avatarGroupLabel(this.counted)}>
        <slot onSlotchange={() => this.refresh()} />
        {this.overflow > 0 && (
          <pf-avatar
            class="overflow"
            part="overflow"
            size={this.size}
            name={`${this.overflow} more`}
          >
            +{this.overflow}
          </pf-avatar>
        )}
      </Host>
    );
  }
}
