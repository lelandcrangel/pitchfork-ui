import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-metric-card'];

const meta = {
  title: 'Components/MetricCard',
  args: { trend: 'positive', icon: 'chart-bar' },
  argTypes: {
    icon: { control: 'text' },
    trend: { control: 'select', options: ['negative', 'neutral', 'positive'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-metric-card"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
