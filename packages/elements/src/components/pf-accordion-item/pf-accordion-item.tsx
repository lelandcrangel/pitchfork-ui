import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

import type { PfAccordionHeadingLevel } from '../pf-accordion/pf-accordion';

/**
 * One section inside a `pf-accordion`.
 *
 * It owns its header, its panel and the open/close animation; the group owns
 * only *which* sections are open, because in `single` mode that depends on
 * what else is. So this element reports that it was clicked and waits to be
 * told, exactly as `pf-radio-button` does.
 *
 * The header is a real `<button>` in the shadow root, which makes it tabbable
 * with no help and gives Enter and Space for free. `delegatesFocus` is what
 * lets the group's arrow keys hand focus to it through the host.
 *
 * Both IDREFs here point inside this one shadow root, which is the case where
 * an IDREF resolves — the header names the panel with `aria-controls` and the
 * panel names the header back with `aria-labelledby`.
 *
 * @slot title - the header's label.
 * @slot - the section's content.
 * @part heading - the heading element wrapping the header button.
 * @part trigger - the header button.
 * @part title - the label's box inside the header.
 * @part icon - the chevron.
 * @part panel - the animating box around the content.
 * @part content - the region holding the content.
 */
@Component({
  tag: 'pf-accordion-item',
  styleUrl: 'pf-accordion-item.css',
  shadow: { delegatesFocus: true },
})
export class PfAccordionItem {
  /**
   * Identifies the section in the group's open set.
   *
   * Reflected because the generated bindings set props as *properties*: an
   * unreflected prop leaves no attribute, and anything selecting on one — a
   * consumer's stylesheet, or a test — finds nothing. The group reads the
   * property.
   */
  @Prop({ reflect: true }) value = '';

  /** Reflected; the stylesheet and the group's own filtering both read it. */
  @Prop({ reflect: true }) disabled = false;

  /** Set by the group. Reflected, so the stylesheet can turn the chevron. */
  @Prop({ mutable: true, reflect: true }) expanded = false;

  /** Set by the group from its own `headingLevel`. */
  @Prop({ mutable: true }) headingLevel: PfAccordionHeadingLevel = 3;

  /** Asks the group to open or close this section. The group decides. */
  @Event() pfAccordionToggle!: EventEmitter<{ value: string }>;

  /**
   * Coerced, because an attribute of a union-literal type arrives as a string:
   * `heading-level="2"` would otherwise build an `h2` tag out of `"2"` by luck
   * and compare false to `2` everywhere else. Clamped, so a level outside
   * h2–h6 cannot produce a tag that is not a heading at all.
   */
  private get level(): PfAccordionHeadingLevel {
    const asNumber = Math.round(Number(this.headingLevel));
    if (!Number.isFinite(asNumber)) return 3;
    return Math.min(Math.max(asNumber, 2), 6) as PfAccordionHeadingLevel;
  }

  private onClick = () => {
    if (this.disabled) return;
    this.pfAccordionToggle.emit({ value: this.value });
  };

  render() {
    /*
     * A dynamic intrinsic tag, cast to one of the literals: `h('h' + level,
     * ...)` does not type-check, because Stencil's overload for a plain string
     * tag types `class` as a className map and rejects the string.
     */
    const Heading = `h${this.level}` as 'h3';

    return (
      <Host>
        <Heading class="heading" part="heading">
          <button
            type="button"
            id="trigger"
            class="trigger"
            part="trigger"
            aria-expanded={this.expanded ? 'true' : 'false'}
            aria-controls="panel"
            disabled={this.disabled}
            onClick={this.onClick}
          >
            <span class="title" part="title">
              <slot name="title" />
            </span>
            <span class="icon" part="icon" aria-hidden="true">
              <pf-icon name="chevron-down"></pf-icon>
            </span>
          </button>
        </Heading>
        <div class="panel" part="panel">
          {/*
            `inert` as well as the collapsed height, because a panel animating
            to zero still has focusable content in it: without this, tabbing
            from a closed section's header lands inside the box it just closed.
          */}
          <div
            class="content"
            part="content"
            id="panel"
            role="region"
            aria-labelledby="trigger"
            inert={!this.expanded}
          >
            <div class="inner" part="inner">
              <slot />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
