import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CreditCard,
  Input,
  Select,
  type CreditCardBrand,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Patterns/Checkout Form',
  tags: ['test'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function detectBrand(digits: string): CreditCardBrand {
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'generic';
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const wrap: React.CSSProperties = {
  maxWidth: 460,
  width: '100%',
  margin: '0 auto',
};

const previewWrap: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 8,
};

const form: React.CSSProperties = {
  display: 'grid',
  gap: 16,
};

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
};

const total: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  paddingTop: 4,
};

const totalLabel: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-semantic-text-muted)',
  margin: 0,
};

const totalAmount: React.CSSProperties = {
  fontSize: 'var(--font-size-lg)',
  fontWeight: 700,
  margin: 0,
};

// ─── Form ──────────────────────────────────────────────────────────────────────

function CheckoutDemo() {
  const [number, setNumber] = useState('4242 4242 4242 4242');
  const [name, setName] = useState('John Smith');
  const [expiry, setExpiry] = useState('08/27');
  const [cvc, setCvc] = useState('123');
  const [country, setCountry] = useState('us');

  const digits = number.replace(/\D/g, '');
  const brand = detectBrand(digits);

  return (
    <div style={wrap}>
      <Card>
        <CardHeader>
          <div style={previewWrap}>
            <CreditCard
              brand={brand}
              cardNumber={number || '•••• •••• •••• ••••'}
              cardholderName={name || 'Full name'}
              expiry={expiry || 'MM/YY'}
              cvc={cvc}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div style={form}>
            <Input
              label="Card number"
              inputMode="numeric"
              autoComplete="cc-number"
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
            />
            <Input
              label="Cardholder name"
              autoComplete="cc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
            <div style={row}>
              <Input
                label="Expiry"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
              />
              <Input
                label="CVC"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
              />
            </div>
            <Select
              label="Country"
              options={[
                { value: 'us', label: 'United States' },
                { value: 'ca', label: 'Canada' },
                { value: 'gb', label: 'United Kingdom' },
                { value: 'au', label: 'Australia' },
                { value: 'de', label: 'Germany' },
              ]}
              value={country}
              onValueChange={setCountry}
            />

            <div style={total}>
              <p style={totalLabel}>Total due today</p>
              <p style={totalAmount}>$24.00</p>
            </div>

            <Button fullWidth>Pay $24.00</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const Default: Story = {
  render: () => <CheckoutDemo />,
};
