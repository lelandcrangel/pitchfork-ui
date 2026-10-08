import { formatCardNumber, maskCardNumber } from '@pitchfork-ui/core';
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
    const displayNumber = masked ? maskCardNumber(cardNumber) : formatCardNumber(cardNumber);

    return (
      <div ref={ref} className={cx('pf-credit-card', `is-${brand}`, className)} {...props}>
        <div className="top-row">
          <span className="chip" aria-hidden />
          <span className="brand">{brand.toUpperCase()}</span>
        </div>

        <p className="number">{displayNumber}</p>

        <div className="meta">
          <div>
            <span className="label">Card holder</span>
            <span className="value">{cardholderName}</span>
          </div>
          <div>
            <span className="label">Expires</span>
            <span className="value">{expiry}</span>
          </div>
          {cvc ? (
            <div>
              <span className="label">CVC</span>
              <span className="value">{masked ? '***' : cvc}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

CreditCard.displayName = 'CreditCard';
