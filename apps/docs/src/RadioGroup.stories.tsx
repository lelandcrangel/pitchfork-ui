import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from '@pitchfork-ui/react';

const options = [
  { value: 'starter', label: 'Starter' },
  { value: 'business', label: 'Business' },
  { value: 'enterprise', label: 'Enterprise' },
];

const meta = {
  title: 'Components/Radio Groups',
  component: RadioGroup,
  tags: ['ai-generated', 'test'],
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['vertical', 'horizontal'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
  args: {
    name: 'plan',
    legend: 'Choose a plan',
    options,
    defaultValue: 'business',
    orientation: 'vertical',
    disabled: false,
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <RadioGroup {...args} />,
};
