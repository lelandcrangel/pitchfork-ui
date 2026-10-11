import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-radar-chart'];

const meta = {
  title: 'Web components/PfRadarChart',
  args: {
    label: 'Capability review',
    levels: 4,
    showAxes: true,
    showLegend: true,
    size: 260,
    max: 10,
  },
  argTypes: {
    label: { control: 'text' },
    levels: { control: 'number' },
    max: { control: 'number' },
    showAxes: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    size: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-radar-chart"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
