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
    data: [['Mon', 12], ['Tue', 18], ['Wed', 9], ['Thu', 22], ['Fri', 17]],
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
