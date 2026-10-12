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
    data: [
      { label: 'Q1', direct: 120, referral: 80 },
      { label: 'Q2', direct: 180, referral: 140 },
      { label: 'Q3', direct: 150, referral: 190 },
      { label: 'Q4', direct: 240, referral: 210 },
    ],
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
