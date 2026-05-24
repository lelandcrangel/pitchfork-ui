import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from '@pitchfork-ui/react';

const options = [
  { value: 'starter', label: 'Starter plan' },
  { value: 'pro', label: 'Pro plan' },
  { value: 'enterprise', label: 'Enterprise plan', disabled: true },
];

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Pricing tier',
    description: 'Choose the plan that fits your team.',
    placeholder: 'Choose a plan',
    options,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    defaultValue: {
      control: 'select',
      options: ['', 'starter', 'pro', 'enterprise'],
    },
    options: { control: false, table: { disable: true } },
    style: { control: false, table: { disable: true } },
    onClick: { control: false, table: { disable: true } },
    onValueChange: { control: false, table: { disable: true } },
    value: { control: false, table: { disable: true } },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive select',
    description: 'Change options and state from controls.',
    placeholder: 'Choose a plan',
    options,
  },
};
