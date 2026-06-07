import type { Meta, StoryObj } from '@storybook/react-vite';
import { AreaChart, type ChartDataPoint, type ChartSeries } from '@pitchfork-ui/react';

const monthly: ChartDataPoint[] = [
  { label: 'Jan', A: 420, B: 280, C: 160 },
  { label: 'Feb', A: 380, B: 240, C: 140 },
  { label: 'Mar', A: 510, B: 330, C: 195 },
  { label: 'Apr', A: 470, B: 310, C: 180 },
  { label: 'May', A: 620, B: 400, C: 230 },
  { label: 'Jun', A: 580, B: 370, C: 215 },
  { label: 'Jul', A: 700, B: 450, C: 260 },
  { label: 'Aug', A: 660, B: 420, C: 245 },
  { label: 'Sep', A: 530, B: 340, C: 200 },
  { label: 'Oct', A: 490, B: 300, C: 175 },
  { label: 'Nov', A: 410, B: 260, C: 150 },
  { label: 'Dec', A: 440, B: 290, C: 165 },
];

const twoSeries: ChartSeries[] = [
  { key: 'A', label: 'Series A' },
  { key: 'B', label: 'Series B' },
];

const threeSeries: ChartSeries[] = [
  { key: 'A', label: 'Series A' },
  { key: 'B', label: 'Series B' },
  { key: 'C', label: 'Series C' },
];

const monthlyCode = `const monthly = [
  { label: 'Jan', A: 420, B: 280, C: 160 },
  { label: 'Feb', A: 380, B: 240, C: 140 },
  { label: 'Mar', A: 510, B: 330, C: 195 },
  { label: 'Apr', A: 470, B: 310, C: 180 },
  { label: 'May', A: 620, B: 400, C: 230 },
  { label: 'Jun', A: 580, B: 370, C: 215 },
  { label: 'Jul', A: 700, B: 450, C: 260 },
  { label: 'Aug', A: 660, B: 420, C: 245 },
  { label: 'Sep', A: 530, B: 340, C: 200 },
  { label: 'Oct', A: 490, B: 300, C: 175 },
  { label: 'Nov', A: 410, B: 260, C: 150 },
  { label: 'Dec', A: 440, B: 290, C: 165 },
];`;

const twoSeriesCode = `const series = [
  { key: 'A', label: 'Series A' },
  { key: 'B', label: 'Series B' },
];`;

const threeSeriesCode = `const series = [
  { key: 'A', label: 'Series A' },
  { key: 'B', label: 'Series B' },
  { key: 'C', label: 'Series C' },
];`;

const meta = {
  title: 'Examples/AreaChart',
  component: AreaChart,
  tags: ['test', 'examplesHidden'],
  args: { data: monthly, series: twoSeries },
} satisfies Meta<typeof AreaChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <AreaChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${monthlyCode}
${twoSeriesCode}

<AreaChart data={monthly} series={series} yAxisLabel="Active users" />`,
      },
    },
  },
};

export const ThreeSeries: Story = {
  name: 'Three series',
  args: { series: threeSeries },
  render: (args) => <AreaChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${monthlyCode}
${threeSeriesCode}

<AreaChart data={monthly} series={series} yAxisLabel="Active users" />`,
      },
    },
  },
};

export const Straight: Story = {
  name: 'Straight lines',
  args: { curved: false },
  render: (args) => <AreaChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${monthlyCode}
${twoSeriesCode}

<AreaChart data={monthly} series={series} yAxisLabel="Active users" curved={false} />`,
      },
    },
  },
};

export const Empty: Story = {
  name: 'Empty state',
  args: { data: [] },
  render: (args) => <AreaChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${twoSeriesCode}

<AreaChart data={[]} series={series} yAxisLabel="Active users" />`,
      },
    },
  },
};
