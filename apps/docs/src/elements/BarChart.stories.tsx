import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-bar-chart'];

const meta = {
  title: 'Components/BarChart',
  args: {
    data: [['Q1', 120, 80], ['Q2', 180, 140], ['Q3', 150, 190], ['Q4', 240, 210]],
    showLegend: true,
    stacked: false,
    label: 'Signups by quarter',
    yAxisLabel: 'Signups',
  },
  argTypes: {
    data: { control: 'object' },
    label: { control: 'text' },
    showLegend: { control: 'boolean' },
    stacked: { control: 'boolean' },
    yAxisLabel: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-bar-chart"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
