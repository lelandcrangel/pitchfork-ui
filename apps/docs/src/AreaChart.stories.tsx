import type { Meta, StoryObj } from '@storybook/react-vite';
import { AreaChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Area Chart',
  component: AreaChart,
  tags: ['test'],
  args: {
    data: [
      { label: 'Jan', A: 420, B: 280 },
      { label: 'Feb', A: 380, B: 240 },
      { label: 'Mar', A: 510, B: 330 },
      { label: 'Apr', A: 470, B: 310 },
      { label: 'May', A: 620, B: 400 },
      { label: 'Jun', A: 580, B: 370 },
    ],
    series: [
      { key: 'A', label: 'Series A' },
      { key: 'B', label: 'Series B' },
    ],
    yAxisLabel: 'Value',
    showLegend: true,
    curved: true,
  },
  argTypes: {
    yAxisLabel: { control: 'text' },
    showLegend: { control: 'boolean' },
    curved: { control: 'boolean' },
  },
} satisfies Meta<typeof AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <AreaChart {...args} />,
};
