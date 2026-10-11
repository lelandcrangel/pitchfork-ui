import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-credit-card'];

const meta = {
  title: 'Web components/PfCreditCard',
  args: {
    brand: 'visa',
    cardNumber: '4111111111111111',
    cardholderName: 'A. LOVELACE',
    expiry: '04/29',
    masked: true,
  },
  argTypes: {
    brand: { control: 'select', options: ['amex', 'generic', 'mastercard', 'visa'] },
    cardNumber: { control: 'text' },
    cardholderName: { control: 'text' },
    cvc: { control: 'text' },
    expiry: { control: 'text' },
    masked: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-credit-card"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
