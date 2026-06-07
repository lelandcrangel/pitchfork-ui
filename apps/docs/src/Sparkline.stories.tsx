import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Sparkline',
  component: Sparkline,
  tags: ['test'],
  args: {
    data: [420, 380, 510, 470, 620, 580, 700],
    width: 120,
    height: 36,
    variant: 'line',
    strokeWidth: 1.5,
    endDot: false,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['line', 'area'] },
    strokeWidth: { control: { type: 'number', min: 1, max: 4, step: 0.5 } },
    width: { control: { type: 'number', min: 40, max: 400, step: 8 } },
    height: { control: { type: 'number', min: 16, max: 80, step: 4 } },
    endDot: { control: 'boolean' },
    color: { control: 'text' },
    label: { control: 'text' },
  },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Sparkline {...args} />,
};
