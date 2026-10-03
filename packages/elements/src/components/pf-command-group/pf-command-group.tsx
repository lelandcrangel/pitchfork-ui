import { Component, h, Host, Prop } from '@stencil/core';

/**
 * A labelled section of a `pf-command-palette`.
 *
 * Grouping is structural here, where the React component takes a `group` name
 * on each item and buckets them itself. That is not a stylistic choice: the
 * items are slotted light-DOM children, and a shadow root cannot wrap a subset
 * of its slotted children in a box — one `<slot>` renders them all, in source
 * order. So the consumer expresses a group by nesting, which is also what
 * §2.1 asks for everywhere else.
 *
 * @slot - `pf-command-item` children.
 * @part label - the section heading.
 */
@Component({
  tag: 'pf-command-group',
  styleUrl: 'pf-command-group.css',
  shadow: true,
})
export class PfCommandGroup {
  /** The section heading. Searched along with each item's own text. */
  @Prop() label?: string;

  render() {
    return (
      <Host role="group" aria-label={this.label}>
        {this.label && (
          <p class="label" part="label">
            {this.label}
          </p>
        )}
        <slot />
      </Host>
    );
  }
}
