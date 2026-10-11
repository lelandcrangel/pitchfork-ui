import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-pie-chart'];

const meta = {
  title: 'Components/PieChart',
  args: { cutout: 0.58, label: 'Traffic by source', showLegend: true, size: 180 },
  argTypes: {
    cutout: { control: 'number' },
    label: { control: 'text' },
    showLegend: { control: 'boolean' },
    size: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-pie-chart"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
