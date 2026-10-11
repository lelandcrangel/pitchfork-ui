import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-tabs'];

const meta = {
  title: 'Web components/PfTabs',
  args: { fullWidth: false, size: 'md', value: 'pill-one', variant: 'pills' },
  argTypes: {
    fullWidth: { control: 'boolean' },
    size: { control: 'select', options: ['md', 'sm'] },
    value: { control: 'text' },
    variant: { control: 'select', options: ['pills', 'underline'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-tabs"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
