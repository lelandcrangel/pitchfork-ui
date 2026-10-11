import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-empty-state'];

const meta = {
  title: 'Web components/PfEmptyState',
  args: { size: 'md', icon: 'folder-open' },
  argTypes: { icon: { control: 'text' }, size: { control: 'select', options: ['lg', 'md', 'sm'] } },
  render: (args) => (
    <ElementPlayground
      tag="pf-empty-state"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
