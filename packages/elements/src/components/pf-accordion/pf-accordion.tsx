import {
  formatValueList,
  parseValueList,
  resolveListMove,
  resolveRovingKey,
  toggleDisclosureValue,
} from '@pitchfork-ui/core';
import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Method,
  Prop,
  Watch,
} from '@stencil/core';

export type PfAccordionType = 'single' | 'multiple';
export type PfAccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;

/**
 * A stack of `pf-accordion-item` children, of which either one or several can
 * be open.
 *
 * The group owns which sections are open and the arrow keys; each item owns
 * its own header, panel and animation. Same division as `pf-radio-group` and
 * its radios — and for the same reason, since "one open at a time" is not a
 * thing a section can decide for itself.
 *
 * Unlike a tab strip this is **not** a roving tabindex: the ARIA accordion
 * pattern puts every header in the tab sequence, and the arrows are an extra
 * way to move between them rather than the only one. A header is a real
 * `<button>` inside its item's shadow root, so it is tabbable with no help.
 *
 * @slot - the `pf-accordion-item` children.
 */
@Component({
  tag: 'pf-accordion',
  styleUrl: 'pf-accordion.css',
  shadow: true,
})
export class PfAccordion {
  @Element() el!: HTMLElement;

  /**
   * The open sections, as one comma-separated string — which is what an
   * attribute can carry. `pfChange` also reports the parsed array, which is
   * what a framework consumer usually wants.
   */
  @Prop({ mutable: true, reflect: true }) value = '';

  /** `single` closes the others when one opens; `multiple` leaves them. */
  @Prop({ reflect: true }) type: PfAccordionType = 'single';

  /**
   * The heading level each item's header is wrapped in.
   *
   * A union-literal type defeats Stencil's attribute coercion — measured on
   * `pf-time-picker`, where `hour-cycle="12"` arrived as the *string* `"12"` —
   * so the value is coerced before it is pushed down rather than compared
   * here. The union stays because it is the useful type for a framework
   * consumer who really does set the number.
   */
  @Prop() headingLevel: PfAccordionHeadingLevel = 3;

  /** Fires when the open set changes, however it was changed. */
  @Event() pfChange!: EventEmitter<{ value: string; values: string[] }>;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Watch('value')
  @Watch('type')
  @Watch('headingLevel')
  handleStateChange() {
    this.sync();
  }

  /**
   * Re-reads the children, for a consumer who changed one through its
   * *property* — `item.disabled = true` leaves no attribute, moves no node and
   * fires no `slotchange`.
   */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested accordion owns its own sections. */
  private get items(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-accordion-item')).filter(
      (item) => item.parentElement === this.el,
    );
  }

  private get expanded(): string[] {
    return parseValueList(this.value);
  }

  /**
   * The property if the item has been upgraded, the attribute if it has not —
   * `componentWillLoad` can run before a child parsed from HTML upgrades.
   */
  private itemValue(item: HTMLElement) {
    return (item as HTMLElement & { value?: string }).value ?? item.getAttribute('value') ?? '';
  }

  private isDisabled(item: HTMLElement) {
    return (item as HTMLElement & { disabled?: boolean }).disabled ?? item.hasAttribute('disabled');
  }

  private sync() {
    const expanded = this.expanded;
    const level = Number(this.headingLevel) as PfAccordionHeadingLevel;

    for (const item of this.items) {
      const section = item as HTMLElement & {
        expanded: boolean;
        headingLevel: PfAccordionHeadingLevel;
      };
      section.expanded = expanded.includes(this.itemValue(item));
      section.headingLevel = level;
    }
  }

  private setExpanded(next: string[]) {
    this.value = formatValueList(next);
    this.sync();
    this.pfChange.emit({ value: this.value, values: next });
  }

  /**
   * A section asking to be opened or closed. The group decides, because in
   * `single` mode the answer depends on what else is open.
   */
  @Listen('pfAccordionToggle')
  handleToggle(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();

    const item = this.items.find((candidate) => this.itemValue(candidate) === event.detail.value);
    if (!item || this.isDisabled(item)) return;

    this.setExpanded(
      toggleDisclosureValue(this.expanded, event.detail.value, {
        multiple: this.type === 'multiple',
      }),
    );
  }

  /**
   * The arrows move focus between the headers and open nothing: an accordion's
   * sections are opened deliberately, unlike a tab strip's panels. Home and
   * End jump to the first and last enabled header.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    const action = resolveRovingKey(event.key, 'vertical');
    if (!action) return;

    const enabled = this.items.filter((item) => !this.isDisabled(item));
    if (enabled.length === 0) return;

    /*
     * `activeElement` reports the shallowest host, which is the item: the
     * header button it delegates focus to is inside the item's shadow root.
     */
    const currentIndex = enabled.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    const nextIndex = resolveListMove(
      action,
      enabled.map((_, index) => index),
      currentIndex,
    );
    if (nextIndex < 0) return;

    event.preventDefault();
    enabled[nextIndex].focus();
  }

  render() {
    return (
      <Host>
        <slot onSlotchange={() => this.refresh()} />
      </Host>
    );
  }
}
