import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-gauge-chart'];

const meta = {
  title: 'Components/GaugeChart',
  args: { label: 'Storage used', max: 100, size: 180, strokeWidth: 16, value: 73 },
  argTypes: {
    color: { control: 'text' },
    label: { control: 'text' },
    max: { control: 'number' },
    size: { control: 'number' },
    strokeWidth: { control: 'number' },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-gauge-chart"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
