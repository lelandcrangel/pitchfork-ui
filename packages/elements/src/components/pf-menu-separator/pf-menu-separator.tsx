import { Component, h, Host } from '@stencil/core';

/**
 * A rule between groups of menu items.
 *
 * Unlike `pf-toolbar-separator` this needs no orientation: a menu is always a
 * column, so the rule is always horizontal.
 */
@Component({
  tag: 'pf-menu-separator',
  styleUrl: 'pf-menu-separator.css',
  shadow: true,
})
export class PfMenuSeparator {
  render() {
    return <Host role="separator" aria-orientation="horizontal" />;
  }
}
