import { Component, h, Host, Prop } from '@stencil/core';

export type PfToolbarSeparatorOrientation = 'horizontal' | 'vertical';

/**
 * A rule between groups of toolbar controls.
 *
 * `orientation` describes the toolbar it sits in, not the rule's own shape: a
 * horizontal toolbar gets a vertical hairline. `pf-toolbar` sets it on every
 * separator it contains, so a consumer does not have to — and cannot leave one
 * pointing the wrong way.
 */
@Component({
  tag: 'pf-toolbar-separator',
  styleUrl: 'pf-toolbar-separator.css',
  shadow: true,
})
export class PfToolbarSeparator {
  /** The axis of the toolbar this sits in. Reflected for the stylesheet. */
  @Prop({ reflect: true }) orientation: PfToolbarSeparatorOrientation = 'horizontal';

  render() {
    // `aria-orientation` describes the separator itself, which runs across the
    // toolbar's axis: the hairline in a horizontal toolbar is vertical. Passing
    // the toolbar's axis straight through announced it the wrong way round.
    const across = this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
    return <Host role="separator" aria-orientation={across} />;
  }
}
