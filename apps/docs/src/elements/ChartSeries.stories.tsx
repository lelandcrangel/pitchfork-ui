import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-chart-series'];

const meta = {
  title: 'Components/ChartSeries',
  args: {
    children: 'Visits',
    dashed: false,
    seriesKey: '0',
    swatch: '',
    color: 'var(--color-brand-500)',
  },
  argTypes: {
    children: { control: 'text' },
    color: { control: 'text' },
    dashed: { control: 'boolean' },
    seriesKey: { control: 'text' },
    swatch: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-chart-series"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
