import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-input'];

const meta = {
  title: 'Components/Input',
  args: {
    disabled: false,
    readonly: false,
    required: false,
    type: 'text',
    value: '',
    label: 'Email',
    name: 'email',
    placeholder: 'you@example.com',
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
    type: { control: 'select', options: ['email', 'password', 'search', 'tel', 'text', 'url'] },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-input"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
