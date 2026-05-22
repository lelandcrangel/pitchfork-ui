import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Satisfaction score',
    description: 'Choose a score between 0 and 100.',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 64,
    showValue: true,
  },
  argTypes: {
    min: { control: { type: 'number', step: 1 } },
    max: { control: { type: 'number', step: 1 } },
    step: { control: { type: 'number', step: 1, min: 1 } },
    showValue: { control: 'boolean' },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Slider {...args} />,
};
