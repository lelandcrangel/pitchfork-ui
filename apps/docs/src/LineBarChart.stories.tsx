import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LineChart, BarChart } from '@pitchfork-ui/react';

const chartData = [
  { label: 'Jan', sessions: 420, users: 280 },
  { label: 'Feb', sessions: 380, users: 240 },
  { label: 'Mar', sessions: 510, users: 330 },
  { label: 'Apr', sessions: 470, users: 310 },
  { label: 'May', sessions: 620, users: 400 },
  { label: 'Jun', sessions: 580, users: 370 },
  { label: 'Jul', sessions: 700, users: 450 },
  { label: 'Aug', sessions: 660, users: 420 },
  { label: 'Sep', sessions: 530, users: 340 },
  { label: 'Oct', sessions: 490, users: 300 },
  { label: 'Nov', sessions: 410, users: 260 },
  { label: 'Dec', sessions: 440, users: 290 },
];

const chartSeries = [
  { key: 'sessions', label: 'Sessions' },
  { key: 'users', label: 'Users' },
];

const storyDecorator = (Story: React.ComponentType) => (
  <div style={{ maxWidth: 700, width: '100%' }}>
    <Story />
  </div>
);

const lineMeta = {
  title: 'Components/Line & Bar Charts',
  component: LineChart,
  tags: ['test'],
  decorators: [storyDecorator],
  args: {
    data: chartData,
    series: chartSeries,
    yAxisLabel: 'Count',
    showLegend: true,
    area: false,
    curved: true,
  },
  argTypes: {
    yAxisLabel: { control: 'text' },
    showLegend: { control: 'boolean' },
    area: { control: 'boolean' },
    curved: { control: 'boolean' },
  },
} satisfies Meta<typeof LineChart>;

export default lineMeta;
type LineStory = StoryObj<typeof lineMeta>;

export const InteractiveLine: LineStory = {
  name: 'Interactive Line',
};

export const InteractiveBar: StoryObj<typeof BarChart> = {
  name: 'Interactive Bar',
  args: {
    data: chartData,
    series: chartSeries,
    yAxisLabel: 'Count',
    showLegend: true,
    stacked: false,
  },
  argTypes: {
    yAxisLabel: { control: 'text' },
    showLegend: { control: 'boolean' },
    stacked: { control: 'boolean' },
  },
  render: (args) => (
    <BarChart
      data={args.data ?? chartData}
      series={args.series ?? chartSeries}
      yAxisLabel={args.yAxisLabel}
      showLegend={args.showLegend}
      stacked={args.stacked}
    />
  ),
};
