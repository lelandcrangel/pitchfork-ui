import { Component, Element, h, Host, Prop, State } from '@stencil/core';

export type PfTimelineTone = 'default' | 'success' | 'warning' | 'danger';

/**
 * One entry in a `pf-timeline`.
 *
 * @slot title - the entry's title.
 * @slot timestamp - short meta text beside the title.
 * @slot description - secondary text below the title.
 * @slot icon - an icon inside the marker, in place of the plain dot.
 * @part rail - the column holding the marker and the connector.
 * @part marker - the dot, or the circle around a slotted icon.
 * @part connector - the line down to the next entry. Absent on the last.
 * @part content - the box holding title, timestamp and description.
 * @part header - the row holding the title and the timestamp.
 * @part title - the title's box.
 */
@Component({
  tag: 'pf-timeline-item',
  styleUrl: 'pf-timeline-item.css',
  shadow: true,
})
export class PfTimelineItem {
  @Element() el!: HTMLElement;

  /** Marker colour. Reflected so the stylesheet can select on it. */
  @Prop({ reflect: true }) tone: PfTimelineTone = 'default';

  /** Set by the group: the last entry has no connector and no space below. */
  @Prop({ mutable: true, reflect: true }) last = false;

  /**
   * Whether anything is slotted into the marker, which decides how big it is.
   *
   * Asked in JS rather than selected in CSS: `.marker:has(*)` reads as "is
   * anything in here" and always matches, because the `<slot>` is itself a
   * child — measured, and the defect it caused in `pf-menu-item`. The marker
   * is an ancestor of the slotted icon, so `::slotted()` cannot size it
   * either, which leaves this.
   */
  @State() hasIcon = false;

  /**
   * The light DOM is readable here, so the marker is the right size at first
   * paint — the mock DOM never fires `slotchange`, and a real one fires it
   * after the first render.
   */
  componentWillLoad() {
    this.readIcon();
  }

  private readIcon = () => {
    this.hasIcon = Array.from(this.el.children).some(
      (child) => child.getAttribute('slot') === 'icon',
    );
  };

  render() {
    return (
      <Host role="listitem">
        {/* Decorative: the marker repeats what the content already says. */}
        <div class="rail" part="rail" aria-hidden="true">
          <span class={{ marker: true, 'with-icon': this.hasIcon }} part="marker">
            <slot name="icon" onSlotchange={this.readIcon} />
          </span>
          {!this.last && <span class="connector" part="connector" />}
        </div>

        <div class="content" part="content">
          <div class="header" part="header">
            <p class="title" part="title">
              <slot name="title" />
            </p>
            {/*
              No wrapper around the timestamp or the description: a box around
              a slot cannot be collapsed from CSS, so an empty one would leave
              its margin behind on every entry without them. An unassigned slot
              generates nothing, so the styling goes on `::slotted(*)`.
            */}
            <slot name="timestamp" />
          </div>
          <slot name="description" />
        </div>
      </Host>
    );
  }
}
