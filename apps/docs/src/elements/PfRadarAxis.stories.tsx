import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-radar-axis'];

const meta = {
  title: 'Web components/PfRadarAxis',
  args: { drawn: false, label: 'Speed', value: 8 },
  argTypes: {
    drawn: { control: 'boolean' },
    label: { control: 'text' },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-radar-axis"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
