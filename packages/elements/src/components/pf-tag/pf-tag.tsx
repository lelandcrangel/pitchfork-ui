import { Component, Event, EventEmitter, h, Host, Prop } from '@stencil/core';

export type PfTagVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

/**
 * @slot - the tag's label.
 * @part label - the label wrapper.
 * @part dismiss - the remove button, when dismissible.
 */
@Component({
  tag: 'pf-tag',
  styleUrl: 'pf-tag.css',
  shadow: true,
})
export class PfTag {
  @Prop({ reflect: true }) variant: PfTagVariant = 'neutral';

  /** Show a button that removes the tag. */
  @Prop({ reflect: true }) dismissible = false;

  /** Accessible name for the remove button. */
  @Prop() dismissLabel = 'Remove tag';

  /**
   * Fired when the remove button is pressed. The tag does not remove itself —
   * whoever owns the list decides, exactly as the React `onDismiss` callback
   * leaves it to the caller.
   */
  @Event() pfDismiss!: EventEmitter<void>;

  render() {
    return (
      <Host>
        <span class="label" part="label">
          <slot />
        </span>
        {this.dismissible && (
          <button
            type="button"
            class="dismiss"
            part="dismiss"
            aria-label={this.dismissLabel}
            onClick={() => this.pfDismiss.emit()}
          >
            <pf-icon name="circle-xmark"></pf-icon>
          </button>
        )}
      </Host>
    );
  }
}
