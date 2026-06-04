import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, MetricCard, MetricGrid } from '@pitchfork-ui/react';

const twoColumnGridStyle: React.CSSProperties = {
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
};

const meta = {
  title: 'Examples/Metrics',
  component: MetricCard,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OverviewGrid: Story = {
  args: {
    heading: 'Revenue',
    value: '$128k',
  },
  render: () => (
    <MetricGrid>
      <MetricCard
        heading="Monthly recurring revenue"
        value="$128k"
        trend="positive"
        trendLabel="12.4%"
        description="Compared with the previous month."
        iconName="chart-bar"
      />
      <MetricCard
        heading="Net retention"
        value="94.8%"
        trend="neutral"
        trendLabel="0.3%"
        description="Stable over the last 30 days."
        iconName="circle-check"
      />
      <MetricCard
        heading="Churned accounts"
        value="18"
        trend="negative"
        trendLabel="4.1%"
        description="Higher than the previous billing cycle."
        iconName="circle-xmark"
      />
    </MetricGrid>
  ),
  parameters: {
    docs: {
      source: {
        code: `<MetricGrid>
  <MetricCard
    heading="Monthly recurring revenue"
    value="$128k"
    trend="positive"
    trendLabel="12.4%"
    description="Compared with the previous month."
    iconName="chart-bar"
  />
  <MetricCard
    heading="Net retention"
    value="94.8%"
    trend="neutral"
    trendLabel="0.3%"
    description="Stable over the last 30 days."
    iconName="circle-check"
  />
  <MetricCard
    heading="Churned accounts"
    value="18"
    trend="negative"
    trendLabel="4.1%"
    description="Higher than the previous billing cycle."
    iconName="circle-xmark"
  />
</MetricGrid>`,
      },
    },
  },
};

export const WithAction: Story = {
  args: {
    heading: 'Active users',
    value: '24.2k',
  },
  render: () => (
    <MetricCard
      heading="Active users"
      value="24.2k"
      trend="positive"
      trendLabel="8.1%"
      description="Weekly active users across all workspaces."
      iconName="user"
      action={
        <Button size="sm" variant="secondary">
          View report
        </Button>
      }
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<MetricCard
  heading="Active users"
  value="24.2k"
  trend="positive"
  trendLabel="8.1%"
  description="Weekly active users across all workspaces."
  iconName="user"
  action={
    <Button size="sm" variant="secondary">
      View report
    </Button>
  }
/>`,
      },
    },
  },
};

export const CompactGrid: Story = {
  args: {
    heading: 'Metric',
    value: '0',
  },
  render: () => (
    <MetricGrid style={twoColumnGridStyle}>
      <MetricCard heading="Conversion rate" value="6.8%" trend="positive" trendLabel="1.2%" />
      <MetricCard heading="Avg. response time" value="184ms" trend="negative" trendLabel="11ms" />
    </MetricGrid>
  ),
  parameters: {
    docs: {
      source: {
        code: `<MetricGrid>
  <MetricCard
    heading="Conversion rate"
    value="6.8%"
    trend="positive"
    trendLabel="1.2%"
  />
  <MetricCard
    heading="Avg. response time"
    value="184ms"
    trend="negative"
    trendLabel="11ms"
  />
</MetricGrid>`,
      },
    },
  },
};
