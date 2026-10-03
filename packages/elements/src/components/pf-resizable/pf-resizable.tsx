import { clampSplitSize, resolveSplitterKey, splitSizeFromPointer } from '@pitchfork-ui/core';
import {
  Component,
  Element,
  Event,
  EventEmitter,
  h,
  Host,
  Listen,
  Prop,
  Watch,
} from '@stencil/core';

/**
 * Two panels with a draggable separator between them.
 *
 * The panels are slotted — `start` and `end` rather than a default slot taking
 * exactly two children, because a slot cannot be told to take only the first
 * assigned node and a consumer looping in their own template would otherwise
 * find the third child silently ignored, which is what the React `Resizable`
 * does with `Children.toArray(children)`.
 *
 * All of the arithmetic is core's, so this and the React `Resizable` agree on
 * which arrow grows the first panel, on where a pointer sits, and on what a
 * size outside the bounds becomes.
 *
 * @slot start - the first panel: the one whose size this controls.
 * @slot end - the second panel, which takes the rest.
 * @part start - the first panel's box.
 * @part end - the second panel's box.
 * @part handle - the separator.
 * @part grip - the mark in the middle of the separator.
 */
@Component({
  tag: 'pf-resizable',
  styleUrl: 'pf-resizable.css',
  shadow: true,
})
export class PfResizable {
  @Element() el!: HTMLElement;

  /**
   * `horizontal` puts the panels side by side and drags left and right;
   * `vertical` stacks them. Reflected, because the stylesheet selects on it.
   */
  @Prop({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** The first panel's share, in percent. */
  @Prop({ mutable: true }) size = 50;

  /** The first panel's smallest share, in percent. */
  @Prop() min = 10;

  /** Its largest. */
  @Prop() max = 90;

  /** How far one key press moves it, in percent. */
  @Prop() step = 2;

  /** The separator's accessible name. */
  @Prop() handleLabel = 'Resize panels';

  /** Fires when the split changes, by pointer or by key. */
  @Event() pfChange!: EventEmitter<{ size: number }>;

  private dragging = false;

  @Watch('min')
  @Watch('max')
  handleBoundsChange() {
    // A consumer narrowing the bounds must not leave the panel outside them.
    const next = this.resolved;
    if (next !== this.size) this.size = next;
  }

  /**
   * The size actually in force. The consumer's `size` is left as they set it,
   * so narrowing the bounds and widening them again restores what they asked
   * for rather than what it was clamped to.
   */
  private get resolved(): number {
    return clampSplitSize(Number(this.size), { min: this.min, max: this.max });
  }

  private get bounds() {
    return { min: this.min, max: this.max };
  }

  /**
   * A pointer release anywhere ends the drag.
   *
   * On the host rather than the handle, and `pointercancel` as well as
   * `pointerup`: a drag interrupted by the browser — a touch turning into a
   * scroll gesture, a window losing focus mid-drag — fires only `pointercancel`,
   * and without it the splitter stays in a dragging state and follows the
   * pointer around with no button held.
   */
  @Listen('pointerup')
  @Listen('pointercancel')
  handlePointerEnd(event: PointerEvent) {
    if (!this.dragging) return;
    this.dragging = false;
    const handle = this.handle;
    if (handle?.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  }

  private get handle(): HTMLElement | null {
    return this.el.shadowRoot?.querySelector('.handle') ?? null;
  }

  private onPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    this.dragging = true;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    // The separator is the control, so a drag has to focus it.
    handle.focus();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.dragging) return;

    const rect = this.el.getBoundingClientRect();
    /*
     * `null` when the host has no length, which is not hypothetical: a
     * splitter inside a collapsed box measures zero and dividing by it gives
     * Infinity. The size it already had stands.
     */
    const next =
      this.orientation === 'horizontal'
        ? splitSizeFromPointer(event.clientX, rect.left, rect.width, this.bounds)
        : splitSizeFromPointer(event.clientY, rect.top, rect.height, this.bounds);

    if (next !== null) this.commit(next);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    const next = resolveSplitterKey(event.key, {
      orientation: this.orientation,
      size: this.resolved,
      min: this.min,
      max: this.max,
      step: Number(this.step),
    });

    // Nothing is prevented for a key the splitter does not handle, so Up and
    // Down still scroll a page with a horizontal splitter focused.
    if (next === null) return;
    event.preventDefault();
    this.commit(next);
  };

  private commit(next: number) {
    if (next === this.resolved) return;
    this.size = next;
    this.pfChange.emit({ size: next });
  }

  render() {
    const size = this.resolved;
    const horizontal = this.orientation === 'horizontal';

    return (
      <Host>
        <div class="panel start" part="start" style={{ flexBasis: `${size}%` }}>
          <slot name="start" />
        </div>

        <div
          class="handle"
          part="handle"
          role="separator"
          tabindex="0"
          aria-label={this.handleLabel}
          aria-orientation={horizontal ? 'vertical' : 'horizontal'}
          aria-valuenow={String(size)}
          aria-valuemin={String(this.min)}
          aria-valuemax={String(this.max)}
          onPointerDown={this.onPointerDown}
          onPointerMove={this.onPointerMove}
          onKeyDown={this.onKeyDown}
        >
          <span class="grip" part="grip" aria-hidden="true"></span>
        </div>

        <div class="panel end" part="end">
          <slot name="end" />
        </div>
      </Host>
    );
  }
}
