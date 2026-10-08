import { formatCardNumber, maskCardNumber } from '@pitchfork-ui/core';
import { Component, h, Host, Prop } from '@stencil/core';

export type PfCreditCardBrand = 'generic' | 'visa' | 'mastercard' | 'amex';

/**
 * A card-shaped display of payment details. Presentational only — it stores
 * nothing and submits nothing.
 *
 * @part glare - the decorative highlight overlay.
 * @part chip - the decorative chip.
 * @part brand - the brand wordmark.
 * @part number - the grouped card number.
 * @part meta - the row of labelled fields.
 * @part label - each field's caption.
 * @part value - each field's value.
 */
@Component({
  tag: 'pf-credit-card',
  styleUrl: 'pf-credit-card.css',
  shadow: true,
})
export class PfCreditCard {
  /** Card network. Reflected so the stylesheet can pick the gradient. */
  @Prop({ reflect: true }) brand: PfCreditCardBrand = 'generic';

  /** The number to display. Separators in the input are regrouped. */
  @Prop() cardNumber = '';

  /** Name on the card. */
  @Prop() cardholderName = '';

  /** Expiry, displayed as given. */
  @Prop() expiry = '';

  /** Security code. Omit it to leave the field out entirely. */
  @Prop() cvc?: string;

  /**
   * Hide all but the last four digits, and the CVC with it. Defaults to true,
   * so the careless case is the safe one. Reflected for the stylesheet.
   */
  @Prop({ reflect: true }) masked = true;

  render() {
    // Both layers go through core, so the same number is grouped identically.
    const displayNumber = this.masked
      ? maskCardNumber(this.cardNumber)
      : formatCardNumber(this.cardNumber);

    return (
      <Host>
        <div class="glare" part="glare" aria-hidden="true" />
        <div class="top-row">
          <span class="chip" part="chip" aria-hidden="true" />
          <span class="brand" part="brand">
            {this.brand.toUpperCase()}
          </span>
        </div>

        <p class="number" part="number">
          {displayNumber}
        </p>

        <div class="meta" part="meta">
          <div class="field">
            <span class="label" part="label">
              Card holder
            </span>
            <span class="value" part="value">
              {this.cardholderName}
            </span>
          </div>
          <div class="field">
            <span class="label" part="label">
              Expires
            </span>
            <span class="value" part="value">
              {this.expiry}
            </span>
          </div>
          {this.cvc && (
            <div class="field">
              <span class="label" part="label">
                CVC
              </span>
              <span class="value" part="value">
                {this.masked ? '***' : this.cvc}
              </span>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
