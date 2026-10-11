import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-tag'];

const meta = {
  title: 'Components/Tag',
  args: { children: 'Tag', dismissLabel: 'Remove tag', dismissible: false, variant: 'neutral' },
  argTypes: {
    children: { control: 'text' },
    dismissLabel: { control: 'text' },
    dismissible: { control: 'boolean' },
    variant: { control: 'select', options: ['brand', 'danger', 'neutral', 'success', 'warning'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-tag"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
