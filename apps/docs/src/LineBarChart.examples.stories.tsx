import type { Meta, StoryObj } from '@storybook/react-vite';
import { LineChart, BarChart } from '@pitchfork-ui/react';

const monthly = [
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

const twoSeries = [
  { key: 'A', label: 'Series A' },
  { key: 'B', label: 'Series B' },
];

const threeSeries = [
  { key: 'A', label: 'Series A' },
  { key: 'B', label: 'Series B' },
  { key: 'C', label: 'Series C' },
];

// ─── LineChart meta ───────────────────────────────────────────────────────

const lineMeta = {
  title: 'Examples/LineChart',
  component: LineChart,
  tags: ['test', 'examplesHidden'],
  args: { data: monthly, series: twoSeries, yAxisLabel: 'Active users' },
} satisfies Meta<typeof LineChart>;

export default lineMeta;
type LineStory = StoryObj<typeof lineMeta>;

export const Line: LineStory = {
  render: (args) => <LineChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<LineChart
  data={monthly}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
  ]}
  yAxisLabel="Active users"
/>`,
      },
    },
  },
};

export const LineArea: LineStory = {
  name: 'Area fill',
  args: { area: true },
  render: (args) => <LineChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<LineChart
  data={monthly}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
  ]}
  yAxisLabel="Active users"
  area
/>`,
      },
    },
  },
};

export const LineDashed: LineStory = {
  name: 'Dashed secondary',
  args: {
    series: [
      { key: 'A', label: 'Series A' },
      { key: 'B', label: 'Series B', dashed: true },
    ],
  },
  render: (args) => <LineChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<LineChart
  data={monthly}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B', dashed: true },
  ]}
  yAxisLabel="Active users"
/>`,
      },
    },
  },
};

export const LineThreeSeries: LineStory = {
  name: 'Three series',
  args: { series: threeSeries },
  render: (args) => <LineChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<LineChart
  data={monthly}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
    { key: 'C', label: 'Series C' },
  ]}
  yAxisLabel="Active users"
/>`,
      },
    },
  },
};

export const LineStraight: LineStory = {
  name: 'Straight lines',
  args: { curved: false },
  render: (args) => <LineChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<LineChart
  data={monthly}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
  ]}
  yAxisLabel="Active users"
  curved={false}
/>`,
      },
    },
  },
};

export const LineEmpty: LineStory = {
  name: 'Empty state',
  args: { data: [] },
  render: (args) => <LineChart {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<LineChart
  data={[]}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
  ]}
  yAxisLabel="Active users"
/>`,
      },
    },
  },
};

// ─── BarChart stories (second meta via storybook CSF named export pattern) ─

export const BarGrouped: StoryObj = {
  name: 'Bar — grouped',
  render: () => (
    <BarChart
      data={monthly}
      series={twoSeries}
      yAxisLabel="Active users"
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<BarChart
  data={monthly}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
  ]}
  yAxisLabel="Active users"
/>`,
      },
    },
  },
};

export const BarStacked: StoryObj = {
  name: 'Bar — stacked',
  render: () => (
    <BarChart
      data={monthly}
      series={threeSeries}
      yAxisLabel="Active users"
      stacked
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<BarChart
  data={monthly}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
    { key: 'C', label: 'Series C' },
  ]}
  yAxisLabel="Active users"
  stacked
/>`,
      },
    },
  },
};

export const BarSingle: StoryObj = {
  name: 'Bar — single series',
  render: () => (
    <BarChart
      data={monthly}
      series={[{ key: 'A', label: 'Sessions' }]}
      yAxisLabel="Sessions"
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<BarChart
  data={monthly}
  series={[{ key: 'A', label: 'Sessions' }]}
  yAxisLabel="Sessions"
/>`,
      },
    },
  },
};

export const BarEmpty: StoryObj = {
  name: 'Bar — empty state',
  render: () => (
    <BarChart data={[]} series={twoSeries} />
  ),
  parameters: {
    docs: {
      source: {
        code: `<BarChart
  data={[]}
  series={[
    { key: 'A', label: 'Series A' },
    { key: 'B', label: 'Series B' },
  ]}
/>`,
      },
    },
  },
};
