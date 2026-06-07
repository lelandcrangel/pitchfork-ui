import type { Meta, StoryObj } from '@storybook/react-vite';
import { GaugeChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Gauge Chart',
  component: GaugeChart,
  tags: ['test'],
  args: {
    value: 67,
    max: 100,
    size: 200,
    strokeWidth: 16,
  },
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 100 } },
    max: { control: { type: 'number', min: 1 } },
    size: { control: { type: 'number', min: 80, max: 400, step: 8 } },
    strokeWidth: { control: { type: 'number', min: 4, max: 40, step: 2 } },
    centerLabel: { control: 'text' },
    subLabel: { control: 'text' },
    color: { control: 'text' },
  },
} satisfies Meta<typeof GaugeChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <GaugeChart {...args} />,
};
