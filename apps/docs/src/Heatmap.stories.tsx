import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heatmap, type HeatmapDatum } from '@pitchfork-ui/react';

// Deterministic pseudo-random activity for a stable demo.
function generateActivity(start: string, days: number): HeatmapDatum[] {
  const out: HeatmapDatum[] = [];
  const [y, m, d] = start.split('-').map(Number);
  const cursor = new Date(y, m - 1, d);
  let seed = 1337;
  for (let i = 0; i < days; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const value = Math.floor((seed / 0x7fffffff) ** 2 * 12);
    const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    out.push({ date: iso, value });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

const yearData = generateActivity('2025-01-01', 365);

const meta = {
  title: 'Components/Heatmap',
  component: Heatmap,
  tags: ['test'],
  args: {
    data: yearData,
    levels: 5,
    weekStartsOn: 0,
    cellSize: 12,
    cellGap: 3,
    showWeekdayLabels: true,
    showMonthLabels: true,
  },
  argTypes: {
    levels: { control: { type: 'number', min: 2, max: 8 } },
    weekStartsOn: { control: 'inline-radio', options: [0, 1] },
    cellSize: { control: { type: 'number', min: 8, max: 24, step: 1 } },
    cellGap: { control: { type: 'number', min: 0, max: 8, step: 1 } },
    showWeekdayLabels: { control: 'boolean' },
    showMonthLabels: { control: 'boolean' },
  },
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Heatmap {...args} />,
};
