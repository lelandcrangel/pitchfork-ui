import { Component, Element, h, Host, Prop, State } from '@stencil/core';

export type PfContentDividerOrientation = 'horizontal' | 'vertical';

/**
 * A rule that separates content, optionally labelled.
 *
 * @slot - the divider's label. Leave it empty for a plain rule; the element
 * notices either way and lays the rule out accordingly. Ignored when
 * `orientation` is `vertical`, which has nowhere to put a label.
 *
 * @part line - each of the two rule segments either side of the label, or the
 * single segment when there is no label.
 * @part label - the wrapper around the slotted label.
 */
@Component({
  tag: 'pf-content-divider',
  styleUrl: 'pf-content-divider.css',
  shadow: true,
})
export class PfContentDivider {
  @Element() el!: HTMLElement;

  /** Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) orientation: PfContentDividerOrientation = 'horizontal';

  /** Pad the divider horizontally. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) inset = false;

  /**
   * Whether anything is slotted. Drives the layout: a labelled divider is
   * rule-label-rule, an unlabelled one is a single rule. It cannot be a `@Prop`
   * because the consumer never states it — the presence of slotted content is
   * the statement, and that can change after first render.
   */
  @State() hasLabel = false;

  componentWillLoad() {
    this.syncLabel();
  }

  /**
   * Reads the light DOM rather than the slot's `assignedNodes()`. Both give the
   * same answer for a single default slot, but the light DOM can be read before
   * first render, so the divider lays out correctly on its first paint instead
   * of flickering from unlabelled to labelled once `slotchange` lands. It is
   * also the only one of the two that Stencil's mock DOM implements.
   *
   * A whitespace-only text node is what a formatter leaves behind in
   * `<pf-content-divider>\n</pf-content-divider>`, and it is not a label.
   */
  private syncLabel = () => {
    this.hasLabel = Array.from(this.el.childNodes).some((node) => {
      if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
      if (node.nodeType !== Node.ELEMENT_NODE) return false;
      // Anything aimed at a named slot this element does not have is not a label.
      return !(node as Element).getAttribute('slot');
    });
  };

  render() {
    return (
      <Host role="separator" aria-orientation={this.orientation}>
        <span part="line" class="line" aria-hidden="true" />
        <span part="label" class={{ label: true, 'label--empty': !this.hasLabel }}>
          <slot onSlotchange={this.syncLabel} />
        </span>
        <span
          part="line"
          class={{ line: true, 'line--hidden': !this.hasLabel }}
          aria-hidden="true"
        />
      </Host>
    );
  }
}
