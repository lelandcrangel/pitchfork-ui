import { Component, h, Host } from '@stencil/core';

/**
 * A responsive grid of `pf-metric-card` children.
 *
 * Nothing but layout — the cards are independent, so there is no state to
 * push down and no group behaviour to own. It exists because the column
 * arithmetic (`auto-fit`, `minmax(220px, 1fr)`) is a decision rather than
 * something a consumer should have to repeat.
 *
 * @slot - the `pf-metric-card` children.
 */
@Component({
  tag: 'pf-metric-grid',
  styleUrl: 'pf-metric-grid.css',
  shadow: true,
})
export class PfMetricGrid {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
