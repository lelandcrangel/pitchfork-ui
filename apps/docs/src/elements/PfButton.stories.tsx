import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-button'];

const meta = {
  title: 'Web components/PfButton',
  args: {
    children: 'Button',
    disabled: false,
    fullWidth: false,
    loading: false,
    size: 'md',
    type: 'button',
    variant: 'primary',
  },
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    label: { control: 'text' },
    loading: { control: 'boolean' },
    size: { control: 'select', options: ['lg', 'md', 'sm'] },
    type: { control: 'select', options: ['button', 'reset', 'submit'] },
    variant: { control: 'select', options: ['destructive', 'ghost', 'primary', 'secondary'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-button"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
