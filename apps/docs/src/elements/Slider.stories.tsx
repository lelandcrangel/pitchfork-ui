import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-slider'];

const meta = {
  title: 'Components/Slider',
  args: {
    disabled: false,
    max: 100,
    min: 0,
    showValue: true,
    step: 1,
    value: 40,
    label: 'Volume',
    name: 'volume',
  },
  argTypes: {
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    label: { control: 'text' },
    max: { control: 'number' },
    min: { control: 'number' },
    name: { control: 'text' },
    showValue: { control: 'boolean' },
    step: { control: 'number' },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-slider"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
