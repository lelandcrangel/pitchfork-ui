import type { Meta, StoryObj } from '@storybook/react-vite';
import { PieChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Pie Charts',
  component: PieChart,
  tags: ['ai-generated', 'test'],
  args: {
    size: 192,
    cutout: 0.58,
    showLegend: true,
    centerLabel: '12.4k',
    data: [
      { label: 'Product', value: 48 },
      { label: 'Enterprise', value: 32 },
      { label: 'Services', value: 20 },
    ],
  },
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <PieChart {...args} />,
};
