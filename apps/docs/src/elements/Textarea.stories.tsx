import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-textarea'];

const meta = {
  title: 'Components/Textarea',
  args: {
    disabled: false,
    readonly: false,
    required: false,
    rows: 3,
    value: '',
    label: 'Message',
    name: 'message',
    placeholder: 'What happened?',
    description: 'Markdown is not supported.',
  },
  argTypes: {
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    label: { control: 'text' },
    name: { control: 'text' },
    placeholder: { control: 'text' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    rows: { control: 'number' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-textarea"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
