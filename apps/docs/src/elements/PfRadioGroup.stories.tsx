import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-radio-group'];

const meta = {
  title: 'Web components/PfRadioGroup',
  args: {
    disabled: false,
    orientation: 'horizontal',
    required: false,
    value: 'standard',
    name: 'delivery',
    legend: 'Delivery',
  },
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    legend: { control: 'text' },
    name: { control: 'text' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    required: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-radio-group"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
