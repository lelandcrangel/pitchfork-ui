import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-select'];

const meta = {
  title: 'Components/Select',
  args: {
    disabled: false,
    open: false,
    placeholder: 'Select an option',
    required: false,
    value: 'banana',
    label: 'Fruit',
    name: 'fruit',
  },
  argTypes: {
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    label: { control: 'text' },
    maxVisibleOptions: { control: 'number' },
    name: { control: 'text' },
    open: { control: 'boolean' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-select"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
