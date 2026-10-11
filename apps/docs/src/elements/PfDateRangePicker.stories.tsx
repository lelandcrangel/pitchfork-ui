import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-date-range-picker'];

const meta = {
  title: 'Web components/PfDateRangePicker',
  args: {
    allowClear: false,
    disabled: false,
    open: false,
    placeholder: 'Select dates',
    required: false,
    value: '2026-03-10/2026-03-20',
    label: 'Stay',
    name: 'stay',
  },
  argTypes: {
    allowClear: { control: 'boolean' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    endYear: { control: 'number' },
    error: { control: 'text' },
    isDateDisabled: { control: false },
    label: { control: 'text' },
    max: { control: 'text' },
    min: { control: 'text' },
    name: { control: 'text' },
    open: { control: 'boolean' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    startYear: { control: 'number' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-date-range-picker"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
