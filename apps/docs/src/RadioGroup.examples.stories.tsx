import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { RadioGroup, type RadioGroupOption } from '@pitchfork-ui/react';

const planOptions: RadioGroupOption[] = [
  { value: 'starter', label: 'Starter' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' },
];

const billingOptions: RadioGroupOption[] = [
  {
    value: 'monthly',
    label: 'Monthly billing',
    description: 'Pay each month with flexibility to cancel any time.',
  },
  {
    value: 'annual',
    label: 'Annual billing',
    description: 'Save 20% with a yearly subscription.',
  },
];

const planOptionsCode = `const options = [
  { value: 'starter', label: 'Starter' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' },
];`;

const billingOptionsCode = `const options = [
  {
    value: 'monthly',
    label: 'Monthly billing',
    description: 'Pay each month with flexibility to cancel any time.',
  },
  {
    value: 'annual',
    label: 'Annual billing',
    description: 'Save 20% with a yearly subscription.',
  },
];`;

const meta = {
  title: 'Examples/Radio Groups',
  component: RadioGroup,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    name: 'plan',
    legend: 'Choose a plan',
    options: planOptions,
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { name: 'plan-basic', defaultValue: 'business' },
  render: (args) => <RadioGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${planOptionsCode}

<RadioGroup
  name="plan"
  legend="Choose a plan"
  options={options}
  defaultValue="business"
/>`,
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/business/i)).toBeChecked();
  },
};

export const Horizontal: Story = {
  args: { name: 'plan-horizontal', orientation: 'horizontal', defaultValue: 'starter' },
  render: (args) => <RadioGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${planOptionsCode}

<RadioGroup
  name="plan"
  legend="Choose a plan"
  options={options}
  orientation="horizontal"
  defaultValue="starter"
/>`,
      },
    },
  },
};

export const WithDescriptions: Story = {
  args: {
    name: 'billing-cycle',
    legend: 'Billing cycle',
    options: billingOptions,
    defaultValue: 'annual',
  },
  render: (args) => <RadioGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${billingOptionsCode}

<RadioGroup
  name="billing-cycle"
  legend="Billing cycle"
  options={options}
  defaultValue="annual"
/>`,
      },
    },
  },
};

export const Disabled: Story = {
  args: { name: 'plan-disabled', defaultValue: 'enterprise', disabled: true },
  render: (args) => <RadioGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${planOptionsCode}

<RadioGroup
  name="plan"
  legend="Choose a plan"
  options={options}
  defaultValue="enterprise"
  disabled
/>`,
      },
    },
  },
};
