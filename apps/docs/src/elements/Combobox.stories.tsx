import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-combobox'];

const meta = {
  title: 'Components/Combobox',
  args: {
    clearLabel: 'Clear',
    clearable: true,
    disabled: false,
    emptyMessage: 'No matches',
    open: false,
    placeholder: 'Start typing…',
    required: false,
    value: '',
    label: 'City',
    name: 'city',
  },
  argTypes: {
    clearLabel: { control: 'text' },
    clearable: { control: 'boolean' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    emptyMessage: { control: 'text' },
    error: { control: 'text' },
    label: { control: 'text' },
    name: { control: 'text' },
    open: { control: 'boolean' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-combobox"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
