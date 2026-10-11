import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-visually-hidden'];

const meta = {
  title: 'Web components/PfVisuallyHidden',
  args: { children: 'out of 5 stars', focusable: false },
  argTypes: { children: { control: 'text' }, focusable: { control: 'boolean' } },
  render: (args) => (
    <ElementPlayground
      tag="pf-visually-hidden"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
