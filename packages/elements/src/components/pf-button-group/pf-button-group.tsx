import { formatValueList, parseValueList, toggleValueInList } from '@pitchfork-ui/core';
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

/**
 * A row of joined toggle buttons: pick one, or several.
 *
 * The group owns the selection, because "one at a time" is not a thing a
 * button can decide for itself — the same division as `pf-radio-group`. Each
 * `pf-button-group-item` renders a real `<button>` in its own shadow root, so
 * every one of them is an ordinary tab stop: a group of toggle buttons is not
 * a roving-tabindex pattern, unlike a toolbar or a tab strip.
 *
 * `value` is one comma-separated string, because that is what an attribute
 * can carry; `pfChange` also reports the parsed array, which is what a
 * framework consumer usually wants.
 *
 * @slot - the `pf-button-group-item` children.
 */
@Component({
  tag: 'pf-button-group',
  styleUrl: 'pf-button-group.css',
  shadow: true,
})
export class PfButtonGroup {
  @Element() el!: HTMLElement;

  /** The chosen value, or values, as one comma-separated string. */
  @Prop({ mutable: true, reflect: true }) value = '';

  /** Allow several at once. Reflected for the stylesheet. */
  @Prop({ reflect: true }) multiple = false;

  /** Disable every button. Reflected, and pushed down. */
  @Prop({ reflect: true }) disabled = false;

  /** Fires when the selection changes, however it was changed. */
  @Event() pfChange!: EventEmitter<{ value: string; values: string[] }>;

  /** The light DOM is readable here, so first paint is already right. */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  @Watch('value')
  @Watch('multiple')
  @Watch('disabled')
  handleStateChange() {
    this.sync();
  }

  /** Re-reads the children, for a consumer who changed one through a property. */
  @Method()
  async refresh() {
    this.sync();
  }

  /** Direct children only: a nested group owns its own buttons. */
  private get items(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-button-group-item')).filter(
      (item) => item.parentElement === this.el,
    );
  }

  private get chosen(): string[] {
    return parseValueList(this.value);
  }

  /**
   * The property if the item has upgraded, the attribute if it has not:
   * `componentWillLoad` can run before a child parsed from HTML upgrades.
   */
  private itemValue(item: HTMLElement) {
    return (item as HTMLElement & { value?: string }).value ?? item.getAttribute('value') ?? '';
  }

  private sync() {
    const chosen = this.chosen;

    for (const item of this.items) {
      const node = item as HTMLElement & { selected: boolean; groupDisabled: boolean };
      node.selected = chosen.includes(this.itemValue(item));
      /*
       * The group's disabled state goes to a prop of its own, not to the
       * item's `disabled`: that one is the consumer's, and overwriting it
       * would lose a button they had disabled on its own — and un-disable it
       * the moment the group was enabled again.
       */
      node.groupDisabled = this.disabled;
    }
  }

  /**
   * A button asking to be chosen. The group decides, because in single mode
   * the answer depends on what else is chosen.
   */
  @Listen('pfButtonGroupSelect')
  handleSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    if (this.disabled) return;

    const item = this.items.find((candidate) => this.itemValue(candidate) === event.detail.value);
    if (!item || (item as HTMLElement & { disabled?: boolean }).disabled) return;

    const next = this.multiple
      ? toggleValueInList(this.chosen, event.detail.value)
      : [event.detail.value];

    this.value = formatValueList(next);
    this.sync();
    this.pfChange.emit({ value: this.value, values: next });
  }

  render() {
    return (
      <Host role="group">
        <slot onSlotchange={() => this.refresh()} />
      </Host>
    );
  }
}
