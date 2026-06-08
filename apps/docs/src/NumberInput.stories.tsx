import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberInput } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/NumberInput',
  component: NumberInput,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Quantity',
    description: 'Use the steppers or type a value.',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 1,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    defaultValue: { control: 'number' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    onValueChange: { action: 'value changed' },
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive number input',
    description: 'Adjust min, max, step, and value from controls.',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 5,
  },
};
