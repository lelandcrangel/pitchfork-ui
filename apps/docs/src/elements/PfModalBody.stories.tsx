import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-modal-body'];

const meta = {
  title: 'Web components/PfModalBody',
  args: {
    children: 'The body is the part that scrolls when the content is taller than the dialog.',
  },
  argTypes: { children: { control: 'text' } },
  render: (args) => (
    <ElementPlayground
      tag="pf-modal-body"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
