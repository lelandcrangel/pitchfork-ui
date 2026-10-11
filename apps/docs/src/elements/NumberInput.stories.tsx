import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-number-input'];

const meta = {
  title: 'Components/NumberInput',
  args: {
    decrementLabel: 'Decrease',
    disabled: false,
    incrementLabel: 'Increase',
    required: false,
    step: 1,
    value: '2',
    label: 'Quantity',
    name: 'quantity',
    min: 0,
    max: 10,
  },
  argTypes: {
    decrementLabel: { control: 'text' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    incrementLabel: { control: 'text' },
    label: { control: 'text' },
    max: { control: 'number' },
    min: { control: 'number' },
    name: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    step: { control: 'number' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-number-input"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
