import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadarChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Radar Charts',
  component: RadarChart,
  tags: ['ai-generated', 'test'],
  args: {
    size: 280,
    levels: 4,
    showAxes: true,
    showLegend: true,
    data: [
      { label: 'Usability', value: 78 },
      { label: 'Performance', value: 64 },
      { label: 'Security', value: 82 },
      { label: 'Reliability', value: 73 },
      { label: 'Scalability', value: 69 },
    ],
  },
} satisfies Meta<typeof RadarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <RadarChart {...args} />,
};
