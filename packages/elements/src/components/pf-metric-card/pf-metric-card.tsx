import { Component, Element, h, Host, Prop, State } from '@stencil/core';

export type PfMetricTrend = 'positive' | 'negative' | 'neutral';

/** The symbol each trend is drawn with, which is decorative either way. */
const TREND_SYMBOL: Record<PfMetricTrend, string> = {
  positive: '+',
  negative: '-',
  neutral: '=',
};

/**
 * One figure worth looking at: a heading, the number, and optionally how it
 * has moved.
 *
 * @slot heading - what the number is.
 * @slot - the number.
 * @slot trend - how it has moved, shown as a pill beside the number.
 * @slot description - a line below the number.
 * @slot icon - a small icon beside the heading.
 * @slot action - a control in the card's top corner.
 * @part header - the row holding the heading and the action.
 * @part heading - the heading's box.
 * @part icon - the icon's box.
 * @part action - the box holding the action slot.
 * @part body - the row holding the number and the trend.
 * @part value - the number's box.
 * @part trend - the trend pill.
 */
@Component({
  tag: 'pf-metric-card',
  styleUrl: 'pf-metric-card.css',
  shadow: true,
})
export class PfMetricCard {
  @Element() el!: HTMLElement;

  /** Which way the trend reads. Reflected so the stylesheet can colour it. */
  @Prop({ reflect: true }) trend: PfMetricTrend = 'neutral';

  /** An icon name from the same registry as `pf-icon`. */
  @Prop() icon?: string;

  /**
   * Which of the optional slots have anything in them.
   *
   * Asked in JS because each of these three carries layout — a row, a pill —
   * that its content cannot, and a wrapper around a slot cannot be collapsed
   * from CSS: `:not(:has(*))` never matches, since the `<slot>` is itself a
   * child. The description needs no box, so it is styled through `::slotted()`
   * and collapses on its own.
   */
  @State() hasIcon = false;
  @State() hasAction = false;
  @State() hasTrend = false;

  /** Read from the light DOM, so first paint is right without `slotchange`. */
  componentWillLoad() {
    this.read();
  }

  private read = () => {
    const slotted = (name: string) =>
      Array.from(this.el.children).some((child) => child.getAttribute('slot') === name);

    this.hasIcon = slotted('icon');
    this.hasAction = slotted('action');
    this.hasTrend = slotted('trend');
  };

  render() {
    const showIcon = this.hasIcon || Boolean(this.icon);

    return (
      <Host>
        <div class="header" part="header">
          <div class="heading-wrap">
            <p class="heading" part="heading">
              <slot name="heading" />
            </p>
            {/*
              Every one of these boxes stays in the tree and is hidden when
              empty, rather than being left out: a slot that is not rendered
              never fires `slotchange`, so content added later would stay
              invisible for good.
            */}
            <span class={{ icon: true, empty: !showIcon }} part="icon" aria-hidden="true">
              {this.icon && !this.hasIcon && <pf-icon name={this.icon}></pf-icon>}
              <slot name="icon" onSlotchange={this.read} />
            </span>
          </div>
          <span class={{ action: true, empty: !this.hasAction }} part="action">
            <slot name="action" onSlotchange={this.read} />
          </span>
        </div>

        <div class="body" part="body">
          <p class="value" part="value">
            <slot />
          </p>
          <span class={{ trend: true, empty: !this.hasTrend }} part="trend">
            {/* Decorative: the trend's direction is in its label and its colour. */}
            <span class="trend-symbol" aria-hidden="true">
              {TREND_SYMBOL[this.trend] ?? TREND_SYMBOL.neutral}
            </span>
            <slot name="trend" onSlotchange={this.read} />
          </span>
        </div>

        <slot name="description" />
      </Host>
    );
  }
}
