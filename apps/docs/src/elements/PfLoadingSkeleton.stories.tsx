import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-loading-skeleton'];

const meta = {
  title: 'Web components/PfLoadingSkeleton',
  args: { height: 16, label: 'Loading content', rounded: false, width: '100%' },
  argTypes: {
    height: { control: 'number' },
    label: { control: 'text' },
    rounded: { control: 'boolean' },
    width: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-loading-skeleton"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
