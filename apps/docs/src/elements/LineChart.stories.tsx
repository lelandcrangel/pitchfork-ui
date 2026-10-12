import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-line-chart'];

const meta = {
  title: 'Components/LineChart',
  args: {
    area: true,
    curved: true,
    data: [
      { label: 'Mon', visits: 12 },
      { label: 'Tue', visits: 18 },
      { label: 'Wed', visits: 9 },
      { label: 'Thu', visits: 22 },
      { label: 'Fri', visits: 17 },
    ],
    showLegend: true,
    label: 'Weekly visits',
    yAxisLabel: 'Visits',
  },
  argTypes: {
    area: { control: 'boolean' },
    curved: { control: 'boolean' },
    data: { control: 'object' },
    label: { control: 'text' },
    showLegend: { control: 'boolean' },
    yAxisLabel: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-line-chart"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
