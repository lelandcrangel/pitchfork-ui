import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-pie-slice'];

const meta = {
  title: 'Web components/PfPieSlice',
  args: {
    children: 'Direct',
    drawn: false,
    share: 0,
    swatch: '',
    value: 48,
    color: 'var(--color-brand-500)',
  },
  argTypes: {
    children: { control: 'text' },
    color: { control: 'text' },
    drawn: { control: 'boolean' },
    share: { control: 'number' },
    swatch: { control: 'text' },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-pie-slice"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
