import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-tree-item'];

const meta = {
  title: 'Web components/PfTreeItem',
  args: {
    active: false,
    disabled: false,
    expanded: true,
    hasChildren: true,
    level: 1,
    selected: false,
    value: 'src',
  },
  argTypes: {
    active: { control: 'boolean' },
    disabled: { control: 'boolean' },
    expanded: { control: 'boolean' },
    hasChildren: { control: 'boolean' },
    icon: { control: 'text' },
    level: { control: 'number' },
    selected: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-tree-item"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
