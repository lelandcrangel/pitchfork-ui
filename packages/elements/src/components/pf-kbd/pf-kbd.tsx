import { formatKeyCombination } from '@pitchfork-ui/core';
import { Component, h, Prop } from '@stencil/core';

export type PfKbdSize = 'sm' | 'md';

/**
 * A keyboard key or a combination of them, as `<kbd>` elements.
 *
 * `keys` renders one cap per entry with separators between; a single key can
 * be slotted instead.
 *
 * @slot - a single key, when `keys` is not given.
 * @part kbd - the native kbd element.
 */
@Component({
  tag: 'pf-kbd',
  styleUrl: 'pf-kbd.css',
  shadow: true,
})
export class PfKbd {
  /** A key combination rendered as one cap, e.g. `["⌘", "K"]`. */
  @Prop() keys?: string[];

  @Prop({ reflect: true }) size: PfKbdSize = 'md';

  /** Separator between keys in a combination. Defaults to `+`. */
  @Prop() separator = '+';

  render() {
    const combination = this.keys?.length ? formatKeyCombination(this.keys, this.separator) : null;

    return <kbd part="kbd">{combination ?? <slot />}</kbd>;
  }
}
