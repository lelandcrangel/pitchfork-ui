import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadarChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Radar Chart',
  component: RadarChart,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    data: [
      { label: 'A', value: 1 },
      { label: 'B', value: 1 },
      { label: 'C', value: 1 },
    ],
  },
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProductHealth: Story = {
  render: () => (
    <RadarChart
      max={100}
      data={[
        { label: 'Adoption', value: 84 },
        { label: 'Retention', value: 72 },
        { label: 'Reliability', value: 88 },
        { label: 'Support', value: 66 },
        { label: 'Velocity', value: 79 },
      ]}
    />
  ),
};

export const TeamComparisonStyle: Story = {
  render: () => (
    <RadarChart
      max={10}
      levels={5}
      strokeColor="#0ea5e9"
      fillColor="rgb(14 165 233 / 0.2)"
      data={[
        { label: 'Frontend', value: 8 },
        { label: 'Backend', value: 7 },
        { label: 'DevOps', value: 6 },
        { label: 'QA', value: 9 },
        { label: 'UX', value: 8 },
        { label: 'Docs', value: 5 },
      ]}
    />
  ),
};

export const MinimalNoLegend: Story = {
  render: () => (
    <RadarChart
      size={220}
      showLegend={false}
      showAxes={false}
      data={[
        { label: 'A', value: 56 },
        { label: 'B', value: 71 },
        { label: 'C', value: 63 },
        { label: 'D', value: 48 },
        { label: 'E', value: 74 },
      ]}
    />
  ),
};
