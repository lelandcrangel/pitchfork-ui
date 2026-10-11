import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-tree-view'];

const meta = {
  title: 'Web components/PfTreeView',
  args: { expanded: 'docs', value: 'guide.md', label: 'Files' },
  argTypes: { expanded: { control: 'text' }, label: { control: 'text' }, value: { control: 'text' } },
  render: (args) => (
    <ElementPlayground
      tag="pf-tree-view"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
