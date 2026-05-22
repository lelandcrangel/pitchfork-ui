import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreditCard } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Credit Card',
  component: CreditCard,
  tags: ['ai-generated', 'test'],
  args: {
    brand: 'visa',
    cardNumber: '4242 4242 4242 4242',
    cardholderName: 'Leland Rangel',
    expiry: '10/29',
    cvc: '123',
    masked: true,
  },
  argTypes: {
    brand: {
      control: 'select',
      options: ['generic', 'visa', 'mastercard', 'amex'],
    },
    masked: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof CreditCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
