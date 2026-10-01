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
    return <Host role="separator" aria-orientation={this.orientation} />;
  }
}
