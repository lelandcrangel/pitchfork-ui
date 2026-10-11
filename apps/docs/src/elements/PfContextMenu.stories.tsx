import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-context-menu'];

const meta = {
  title: 'Web components/PfContextMenu',
  args: { disabled: false, label: 'Row actions', open: false },
  argTypes: {
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    open: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-context-menu"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
