import type { Meta, StoryObj } from '@storybook/react-vite';
import { PieChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/PieChart',
  component: PieChart,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    data: [{ label: 'Sample', value: 100 }],
  },
} satisfies Meta<typeof PieChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RevenueMix: Story = {
  render: () => (
    <PieChart
      centerLabel="$420k"
      data={[
        { label: 'Subscriptions', value: 58 },
        { label: 'One-time', value: 24 },
        { label: 'Support', value: 18 },
      ]}
    />
  ),
};

export const ChannelSplit: Story = {
  render: () => (
    <PieChart
      centerLabel="Q2"
      data={[
        { label: 'Organic', value: 39, color: '#3b82f6' },
        { label: 'Paid', value: 27, color: '#06b6d4' },
        { label: 'Referral', value: 21, color: '#22c55e' },
        { label: 'Partnerships', value: 13, color: '#f97316' },
      ]}
    />
  ),
};

export const CompactNoLegend: Story = {
  render: () => (
    <PieChart
      size={144}
      cutout={0.66}
      showLegend={false}
      centerLabel="67%"
      data={[
        { label: 'Completed', value: 67, color: '#22c55e' },
        { label: 'Remaining', value: 33, color: '#e5e7eb' },
      ]}
    />
  ),
};

export const EmptyState: Story = {
  render: () => (
    <PieChart
      centerLabel="0"
      emptyLabel="No data"
      data={[
        { label: 'A', value: 0 },
        { label: 'B', value: 0 },
      ]}
    />
  ),
};
