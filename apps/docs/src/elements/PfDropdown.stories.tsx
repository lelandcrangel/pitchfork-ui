import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-dropdown'];

const meta = {
  title: 'Web components/PfDropdown',
  args: { align: 'start', disabled: false, label: 'Actions', open: false },
  argTypes: {
    align: { control: 'select', options: ['end', 'start'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    open: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-dropdown"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
