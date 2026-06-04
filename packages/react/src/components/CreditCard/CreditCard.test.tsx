import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CreditCard } from './CreditCard';

describe('CreditCard', () => {
  it('renders the cardholder name', () => {
    render(<CreditCard cardNumber="4111111111111111" cardholderName="Jane Doe" expiry="12/26" />);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders the expiry date', () => {
    render(<CreditCard cardNumber="4111111111111111" cardholderName="Jane Doe" expiry="12/26" />);
    expect(screen.getByText('12/26')).toBeInTheDocument();
  });

  // ─── Card number masking ─────────────────────────────────────────────────

  it('masks all but the last 4 digits by default', () => {
    render(<CreditCard cardNumber="4111111111111111" cardholderName="Jane Doe" expiry="12/26" />);
    const number = screen.getByText(/\*+/);
    expect(number.textContent).toMatch(/1111$/);
    expect(number.textContent).toContain('*');
  });

  it('shows the full formatted number when masked=false', () => {
    render(
      <CreditCard
        cardNumber="4111111111111111"
        cardholderName="Jane Doe"
        expiry="12/26"
        masked={false}
      />,
    );
    expect(screen.getByText('4111 1111 1111 1111')).toBeInTheDocument();
  });

  // ─── CVC ────────────────────────────────────────────────────────────────

  it('masks the CVC when masked=true', () => {
    render(
      <CreditCard
        cardNumber="4111111111111111"
        cardholderName="Jane"
        expiry="01/27"
        cvc="123"
        masked
      />,
    );
    expect(screen.getByText('***')).toBeInTheDocument();
  });

  it('shows the real CVC when masked=false', () => {
    render(
      <CreditCard
        cardNumber="4111111111111111"
        cardholderName="Jane"
        expiry="01/27"
        cvc="123"
        masked={false}
      />,
    );
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('does not render the CVC row when cvc is omitted', () => {
    render(<CreditCard cardNumber="4111111111111111" cardholderName="Jane" expiry="01/27" />);
    expect(screen.queryByText('CVC')).not.toBeInTheDocument();
  });

  // ─── Brand ───────────────────────────────────────────────────────────────

  it('applies the brand CSS class', () => {
    const { container } = render(
      <CreditCard
        cardNumber="4111111111111111"
        cardholderName="Jane"
        expiry="01/27"
        brand="visa"
      />,
    );
    expect(container.firstChild).toHaveClass('is-visa');
  });

  it('renders the brand label', () => {
    render(
      <CreditCard
        cardNumber="4111111111111111"
        cardholderName="Jane"
        expiry="01/27"
        brand="visa"
      />,
    );
    expect(screen.getByText('VISA')).toBeInTheDocument();
  });
});
