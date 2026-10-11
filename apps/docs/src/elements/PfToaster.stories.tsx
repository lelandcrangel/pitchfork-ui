import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-toaster'];

const meta = {
  title: 'Web components/PfToaster',
  args: { duration: 4000, placement: 'bottom-right' },
  argTypes: {
    duration: { control: 'number' },
    placement: { control: 'select', options: ['bottom-left', 'bottom-right', 'top-left', 'top-right'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-toaster"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
