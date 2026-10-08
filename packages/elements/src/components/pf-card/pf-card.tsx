import { Component, h, Host } from '@stencil/core';

/**
 * A surface that groups related content.
 *
 * The React library's `Card` / `CardHeader` / `CardContent` / `CardFooter` map
 * to four elements rather than to one element with named slots. Named slots
 * would need a slot controller to know whether to render each wrapper at all —
 * an unslotted `header` would otherwise leave a padded, bordered empty strip.
 * Separate elements have no such state: the consumer writing
 * `<pf-card-header>` *is* the signal.
 *
 * @slot - the card's sections, usually `pf-card-header`, `pf-card-content` and
 * `pf-card-footer`, though any content is allowed.
 */
@Component({
  tag: 'pf-card',
  styleUrl: 'pf-card.css',
  shadow: true,
})
export class PfCard {
  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
