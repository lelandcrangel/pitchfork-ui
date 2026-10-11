import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-heatmap'];

const meta = {
  title: 'Components/Heatmap',
  args: {
    cellGap: 3,
    cellSize: 12,
    data: [
      { date: '2026-01-07', value: 4 },
      { date: '2026-01-08', value: 1 },
      { date: '2026-01-20', value: 7 },
      { date: '2026-02-02', value: 3 },
      { date: '2026-02-14', value: 9 },
      { date: '2026-02-25', value: 2 },
    ],
    levels: 5,
    showMonthLabels: true,
    showWeekdayLabels: true,
    weekStartsOn: 1,
    label: 'Commits in the last eight weeks',
    startDate: '2026-01-05',
    endDate: '2026-03-01',
  },
  argTypes: {
    cellGap: { control: 'number' },
    cellSize: { control: 'number' },
    data: { control: 'object' },
    endDate: { control: 'text' },
    label: { control: 'text' },
    levels: { control: 'number' },
    showMonthLabels: { control: 'boolean' },
    showWeekdayLabels: { control: 'boolean' },
    startDate: { control: 'text' },
    weekStartsOn: { control: 'select', options: [0, 1] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-heatmap"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
