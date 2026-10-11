import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-loading-dots'];

const meta = {
  title: 'Web components/PfLoadingDots',
  args: { label: 'Loading', size: 'md' },
  argTypes: { label: { control: 'text' }, size: { control: 'select', options: ['lg', 'md', 'sm'] } },
  render: (args) => (
    <ElementPlayground
      tag="pf-loading-dots"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
