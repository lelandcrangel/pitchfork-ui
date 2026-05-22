import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditCard } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Credit Card',
  component: CreditCard,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof CreditCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visa: Story = {
  args: {
    brand: 'visa',
    cardNumber: '4242 4242 4242 4242',
    cardholderName: 'Leland Rangel',
    expiry: '10/29',
    cvc: '123',
  },
};

export const Mastercard: Story = {
  args: {
    brand: 'mastercard',
    cardNumber: '5555 4444 3333 2222',
    cardholderName: 'Ava Parker',
    expiry: '08/28',
    cvc: '842',
  },
};

export const UnmaskedAmex: Story = {
  args: {
    brand: 'amex',
    cardNumber: '3782 822463 10005',
    cardholderName: 'Jordan Kim',
    expiry: '03/30',
    cvc: '9421',
    masked: false,
  },
};
