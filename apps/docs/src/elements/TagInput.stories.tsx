import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-tag-input'];

const meta = {
  title: 'Components/TagInput',
  args: {
    allowDuplicates: false,
    disabled: false,
    placeholder: 'Add a tag…',
    required: false,
    tagVariant: 'brand',
    value: 'design,systems',
    label: 'Topics',
    name: 'topics',
    max: 5,
    description: 'Enter or comma to add. Paste a comma-separated list to add several.',
  },
  argTypes: {
    allowDuplicates: { control: 'boolean' },
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    label: { control: 'text' },
    max: { control: 'number' },
    name: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    tagVariant: { control: 'select', options: ['brand', 'danger', 'neutral', 'success', 'warning'] },
    validate: { control: false },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-tag-input"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
