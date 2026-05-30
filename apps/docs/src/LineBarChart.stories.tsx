import type { Meta, StoryObj } from '@storybook/react-vite';
import { LineChart } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/LineChart',
  component: LineChart,
  tags: ['test'],
  args: {
    data: [
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
    ],
    series: [
      { key: 'sessions', label: 'Sessions' },
      { key: 'users', label: 'Users' },
    ],
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

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
