import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-time-picker'];

const meta = {
  title: 'Components/TimePicker',
  args: {
    disabled: false,
    hourCycle: 24,
    minuteStep: 1,
    open: false,
    placeholder: 'Select time',
    required: false,
    value: '14:30',
    label: 'Start',
    name: 'start',
  },
  argTypes: {
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    hourCycle: { control: 'select', options: [12, 24] },
    label: { control: 'text' },
    minuteStep: { control: 'number' },
    name: { control: 'text' },
    open: { control: 'boolean' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-time-picker"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
