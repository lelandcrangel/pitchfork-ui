import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-kbd'];

const meta = {
  title: 'Components/Kbd',
  args: { children: 'Esc', separator: '+', size: 'md' },
  argTypes: {
    children: { control: 'text' },
    keys: { control: 'object' },
    separator: { control: 'text' },
    size: { control: 'select', options: ['md', 'sm'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-kbd"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
