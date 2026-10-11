import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-modal'];

const meta = {
  title: 'Web components/PfModal',
  args: {
    dismissable: true,
    open: true,
    showCloseButton: true,
    size: 'md',
    label: 'Delete the workspace',
  },
  argTypes: {
    dismissable: { control: 'boolean' },
    label: { control: 'text' },
    open: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    size: { control: 'select', options: ['lg', 'md', 'sm'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-modal"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
