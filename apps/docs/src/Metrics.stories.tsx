import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricCard } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Metrics',
  component: MetricCard,
  tags: ['ai-generated', 'test'],
  args: {
    heading: 'Monthly recurring revenue',
    value: '$128k',
    trend: 'positive',
    trendLabel: '12.4%',
    description: 'Compared with the previous month.',
    iconName: 'chart-bar',
  },
  argTypes: {
    icon: { control: false },
    action: { control: false },
  },
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <MetricCard {...args} />,
};
