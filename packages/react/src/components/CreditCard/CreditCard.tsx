import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './CreditCard.css';

export type CreditCardBrand = 'generic' | 'visa' | 'mastercard' | 'amex';

export interface CreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
  brand?: CreditCardBrand;
  cardNumber: string;
  cardholderName: string;
  expiry: string;
  cvc?: string;
  masked?: boolean;
}

const maskCardNumber = (value: string) => {
  const digits = value.replace(/\D+/g, '');
  if (digits.length <= 4) {
    return digits;
  }

  const visible = digits.slice(-4);
  const hiddenLength = digits.length - 4;
  const hidden = `${'*'.repeat(hiddenLength)}${visible}`;
  return hidden.replace(/(.{4})/g, '$1 ').trim();
};

const formatCardNumber = (value: string) => {
  const digits = value.replace(/\D+/g, '');
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

export const CreditCard = forwardRef<HTMLDivElement, CreditCardProps>(
  (
    {
      brand = 'generic',
      cardNumber,
      cardholderName,
      expiry,
      cvc,
      masked = true,
      className,
      ...props
    },
    ref,
  ) => {
    const displayNumber = masked
      ? maskCardNumber(cardNumber)
      : formatCardNumber(cardNumber);

    return (
      <div
        ref={ref}
        className={cx('pf-credit-card', `pf-credit-card--${brand}`, className)}
        {...props}
      >
        <div className="pf-credit-card__top-row">
          <span className="pf-credit-card__chip" aria-hidden />
          <span className="pf-credit-card__brand">{brand.toUpperCase()}</span>
        </div>

        <p className="pf-credit-card__number">{displayNumber}</p>

        <div className="pf-credit-card__meta">
          <div>
            <span className="pf-credit-card__label">Card holder</span>
            <span className="pf-credit-card__value">{cardholderName}</span>
          </div>
          <div>
            <span className="pf-credit-card__label">Expires</span>
            <span className="pf-credit-card__value">{expiry}</span>
          </div>
          {cvc ? (
            <div>
              <span className="pf-credit-card__label">CVC</span>
              <span className="pf-credit-card__value">
                {masked ? '***' : cvc}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

CreditCard.displayName = 'CreditCard';
