import {
  resolveListMove,
  resolveRovingKey,
  resolveSelectedTab,
  syncRovingTabIndex,
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

export type PfTabsVariant = 'underline' | 'pills';
export type PfTabsSize = 'sm' | 'md';

/** One `pf-tab`, read the way the group needs it. */
interface TabDescriptor {
  el: HTMLElement;
  index: number;
  value: string;
  disabled: boolean;
}

/**
 * Distinguishes the ids this element generates. Not `useId`, which has no
 * equivalent here, and not a shadow-scoped literal either: these ids go on
 * *light-DOM* children, so they share the document's namespace with every
 * other tab set on the page.
 */
let instances = 0;

/**
 * The property if the element has been upgraded, the attribute if it has not.
 *
 * `componentWillLoad` runs before the children's own upgrade on a page that
 * parsed them as plain HTML, so the first sync can only read attributes; after
 * that the property is the truth, because the generated bindings set props as
 * properties and leave no attribute behind for an unreflected one.
 */
const readValue = (el: HTMLElement) =>
  (el as HTMLElement & { value?: string }).value ?? el.getAttribute('value') ?? '';

const readDisabled = (el: HTMLElement) =>
  (el as HTMLElement & { disabled?: boolean }).disabled ?? el.hasAttribute('disabled');

const ensureId = (el: HTMLElement, fallback: string) => {
  if (!el.id) el.id = fallback;
  return el.id;
};

/**
 * A tab set: a strip of `pf-tab` children over a stack of `pf-tab-panel`
 * children.
 *
 * Children rather than an `items` array (WEB-COMPONENTS-PLAN.md §2.1), because
 * the React `TabsItem` carries a `label` and a `content` that are both
 * `ReactNode` — neither crosses the HTML boundary, so a consumer nests instead
 * and loops in their own template.
 *
 * A `pf-tab` puts itself in the `tab` slot, so the two kinds of child can be
 * written interleaved — one `pf-tab` and one `pf-tab-panel` per item, which is
 * what a loop over data wants — and still land in the right box.
 *
 * The group owns everything the children cannot see on their own: which one is
 * selected, the single tab stop, the id wiring in both directions, and the
 * sliding indicator. Each `pf-tab` only reports that it was chosen, as
 * `pf-radio-button` does to its group.
 *
 * @slot tab - the `pf-tab` children. They assign themselves to it.
 * @slot - the `pf-tab-panel` children.
 * @part list - the tab strip, which is the `tablist`.
 * @part indicator - the bar or pill that slides to the selected tab.
 * @part panels - the box the panels are slotted into.
 */
@Component({
  tag: 'pf-tabs',
  styleUrl: 'pf-tabs.css',
  shadow: true,
})
export class PfTabs {
  @Element() el!: HTMLElement;

  private uid = ++instances;
  private listEl?: HTMLElement;
  private indicatorEl?: HTMLElement;
  private observer?: ResizeObserver;
  private observed: HTMLElement[] = [];

  /**
   * The selected tab's value.
   *
   * Left exactly as the consumer set it, as the React component leaves its
   * state: a value no tab carries still *shows* the first enabled tab, but it
   * is not silently rewritten here, so a consumer holding `value` sees only
   * the changes they made.
   */
  @Prop({ mutable: true }) value = '';

  /** Underline or pills. Reflected, and pushed down onto every tab. */
  @Prop({ reflect: true }) variant: PfTabsVariant = 'underline';

  /** Tab padding and type scale. Reflected, and pushed down onto every tab. */
  @Prop({ reflect: true }) size: PfTabsSize = 'md';

  /** Stretch the tabs to fill the strip. Reflected, and pushed down. */
  @Prop({ reflect: true }) fullWidth = false;

  /** Fires when the selected tab changes, however it was chosen. */
  @Event() pfChange!: EventEmitter<{ value: string }>;

  /**
   * The light DOM is readable here, so first paint already has the right tab
   * selected and the other panels hidden — the mock DOM never fires
   * `slotchange`, and a real one fires it after the first render.
   */
  componentWillLoad() {
    this.sync();
  }

  componentDidLoad() {
    this.sync();
  }

  /**
   * The indicator is placed from measurements, so it can only be done once the
   * shadow DOM and the slotted tabs have been laid out.
   */
  componentDidRender() {
    this.placeIndicator();
    this.observe();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.observer = undefined;
    this.observed = [];
  }

  @Watch('value')
  @Watch('variant')
  @Watch('size')
  @Watch('fullWidth')
  handleStateChange() {
    this.sync();
    this.placeIndicator();
  }

  /**
   * Re-reads the children.
   *
   * Needed because a consumer can change a tab through its *property* —
   * `tab.disabled = true` — which leaves no attribute, moves no node and so
   * fires neither `slotchange` nor any watcher here.
   */
  @Method()
  async refresh() {
    this.sync();
    this.placeIndicator();
  }

  /** Direct children only: a nested tab set owns its own tabs. */
  private get tabs(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-tab')).filter(
      (tab) => tab.parentElement === this.el,
    );
  }

  private get panels(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('pf-tab-panel')).filter(
      (panel) => panel.parentElement === this.el,
    );
  }

  private get descriptors(): TabDescriptor[] {
    return this.tabs.map((el, index) => ({
      el,
      index,
      value: readValue(el),
      disabled: readDisabled(el),
    }));
  }

  /**
   * The value actually on show: core's rule, so the React `Tabs` falls back to
   * the same tab for a value no tab carries or one that is disabled.
   */
  private get selectedValue(): string {
    return resolveSelectedTab(this.descriptors, this.value)?.value ?? '';
  }

  /**
   * Pushes the group's state down onto the children: which tab is selected,
   * which panel is shown, the id wiring between the two, and one tab stop.
   *
   * The ids go on light-DOM children, which is why they can be referenced at
   * all: tab and panel share the consumer's tree, so `aria-controls` and
   * `aria-labelledby` resolve. The pair an overlay cannot have — a trigger
   * outside pointing at a panel in a shadow root — is the opposite case, and
   * is why `pf-tooltip` copies its text instead.
   */
  private sync() {
    const descriptors = this.descriptors;
    const panels = this.panels;
    const selected = this.selectedValue;

    for (const { el, index, value, disabled } of descriptors) {
      const tabId = ensureId(el, `pf-tabs-${this.uid}-tab-${index}`);
      const panel = panels.find((candidate) => readValue(candidate) === value);
      if (panel) {
        const panelId = ensureId(panel, `pf-tabs-${this.uid}-panel-${index}`);
        el.setAttribute('aria-controls', panelId);
        panel.setAttribute('aria-labelledby', tabId);
      }

      const tab = el as HTMLElement & {
        selected: boolean;
        variant: PfTabsVariant;
        size: PfTabsSize;
        fullWidth: boolean;
      };
      tab.selected = value === selected && !disabled;
      /*
       * Pushed down rather than selected on from above: `:host-context()` is
       * the only selector that would let a tab see its group's variant, and it
       * is in neither Firefox nor Safari. Same reason `pf-toolbar` writes its
       * orientation onto its separators.
       */
      tab.variant = this.variant;
      tab.size = this.size;
      tab.fullWidth = this.fullWidth;
    }

    for (const panel of panels) {
      (panel as HTMLElement & { active: boolean }).active = readValue(panel) === selected;
    }

    this.syncTabIndex(descriptors, selected);
  }

  /**
   * One tab stop for the whole strip, on the selected tab.
   *
   * The ARIA tabs pattern puts it there rather than on whichever tab was
   * focused last, so tabbing in lands on the panel being shown. The React
   * `Tabs` instead leaves every tab tabbable, which is a gap recorded in
   * `todo.md` — the arrows already move selection in both.
   */
  private syncTabIndex(descriptors: TabDescriptor[], selected: string) {
    const enabled = descriptors.filter((descriptor) => !descriptor.disabled);
    if (enabled.length === 0) return;

    const current = enabled.find((descriptor) => descriptor.value === selected);
    syncRovingTabIndex(
      enabled.map((descriptor) => descriptor.el),
      (current ?? enabled[0]).el,
    );
    for (const { el, disabled } of descriptors) {
      if (disabled) el.tabIndex = -1;
    }
  }

  /**
   * Puts the indicator under (or behind) the selected tab.
   *
   * Measured with rects rather than `offsetLeft`, which the React component
   * can use and this one cannot: a slotted element's `offsetParent` is
   * resolved in its *own* node tree, so it is the nearest positioned ancestor
   * in the consumer's document and never the shadow box the element is
   * actually laid out in. Measured twice. Inside a `position: relative`
   * wrapper the selected tab reported `offsetParent: #wrapper` and
   * `offsetLeft: 196` where its offset within the strip was 186 — the
   * wrapper's own padding folded in. And with this placed from `offsetLeft`
   * in a real build, the indicator painted at 64 against a tab starting at
   * 32, which is what `scripts/smoke-consumer.mjs` now catches.
   *
   * Adding back `scrollLeft` is what makes the result scroll-invariant: the
   * indicator is a child of the scrolling strip, so it has to be placed in the
   * strip's scroll coordinates, and both rects move together when it scrolls.
   */
  private placeIndicator() {
    const list = this.listEl;
    const indicator = this.indicatorEl;
    if (!list || !indicator) return;

    const selected = this.selectedValue;
    const tab = this.descriptors.find((descriptor) => descriptor.value === selected)?.el;
    if (!tab) {
      indicator.setAttribute('hidden', '');
      return;
    }
    indicator.removeAttribute('hidden');

    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    indicator.style.left = `${tabRect.left - listRect.left + list.scrollLeft}px`;
    indicator.style.width = `${tabRect.width}px`;

    if (this.variant === 'pills') {
      indicator.style.top = `${tabRect.top - listRect.top + list.scrollTop}px`;
      indicator.style.height = `${tabRect.height}px`;
    } else {
      // The underline's own box comes from the stylesheet; an inline value set
      // by the pills variant would outrank it for good.
      indicator.style.top = '';
      indicator.style.height = '';
    }
  }

  /**
   * Re-measures when the strip or the selected tab changes size.
   *
   * `document.fonts.ready` as well, because a web font loading can change a
   * *sibling* tab's width and so move the selected one without resizing it —
   * which a ResizeObserver on the two of them alone would miss.
   */
  private observe() {
    if (typeof ResizeObserver === 'undefined') return;

    const selected = this.selectedValue;
    const tab = this.descriptors.find((descriptor) => descriptor.value === selected)?.el;
    const next = [this.listEl, tab].filter((node): node is HTMLElement => Boolean(node));
    const unchanged =
      next.length === this.observed.length && next.every((node, i) => node === this.observed[i]);
    if (this.observer && unchanged) return;

    this.observer?.disconnect();
    this.observer = new ResizeObserver(() => this.placeIndicator());
    for (const node of next) this.observer.observe(node);
    this.observed = next;

    document.fonts?.ready.then(() => this.placeIndicator());
  }

  private select(next: string, { focus = false } = {}) {
    const descriptor = this.descriptors.find((candidate) => candidate.value === next);
    if (!descriptor || descriptor.disabled) return;

    /*
     * Against the tab actually on show, not against `value`: with `value`
     * unset the first enabled tab is already selected, and clicking it would
     * otherwise report a change from '' to its value — a `pfChange` for a
     * selection that never moved. `value` is still written, so a consumer
     * reading it back sees what the user picked.
     *
     * The React `Tabs` has no such guard and calls `onValueChange` for a
     * re-click of the selected tab; recorded in `todo.md`.
     */
    const changed = next !== this.selectedValue;
    this.value = next;
    this.sync();
    this.placeIndicator();
    if (focus) descriptor.el.focus();
    if (changed) this.pfChange.emit({ value: next });
  }

  /**
   * A tab asking to be selected — by click, or by Enter or Space on itself.
   * The group decides, exactly as `pf-radio-group` does for its radios.
   */
  @Listen('pfTabSelect')
  handleTabSelect(event: CustomEvent<{ value: string }>) {
    event.stopPropagation();
    this.select(event.detail.value);
  }

  /**
   * The arrows move *and* select, which the ARIA tabs pattern calls automatic
   * activation and allows when the panels are already rendered. Home and End
   * jump to the first and last enabled tab; a disabled tab is skipped rather
   * than focused, because unlike a calendar's blocked day there is nothing
   * behind it to reach.
   */
  @Listen('keydown')
  handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;

    const action = resolveRovingKey(event.key, 'horizontal');
    if (!action) return;

    const enabled = this.descriptors.filter((descriptor) => !descriptor.disabled);
    if (enabled.length === 0) return;

    // `activeElement` reports the shallowest host, which is the tab itself.
    const currentIndex = enabled.findIndex(
      (descriptor) => descriptor.el === (document.activeElement as HTMLElement),
    );
    if (currentIndex === -1) return;

    const nextIndex = resolveListMove(
      action,
      enabled.map((_, index) => index),
      currentIndex,
    );
    if (nextIndex < 0) return;

    event.preventDefault();
    this.select(enabled[nextIndex].value, { focus: true });
  }

  render() {
    return (
      <Host>
        <div
          class="list"
          part="list"
          role="tablist"
          aria-orientation="horizontal"
          ref={(el) => (this.listEl = el)}
        >
          <span
            class="indicator"
            part="indicator"
            aria-hidden="true"
            ref={(el) => (this.indicatorEl = el)}
          />
          <slot name="tab" onSlotchange={() => this.refresh()} />
        </div>
        <div class="panels" part="panels">
          <slot onSlotchange={() => this.refresh()} />
        </div>
      </Host>
    );
  }
}
