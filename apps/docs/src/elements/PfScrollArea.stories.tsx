import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-scroll-area'];

const meta = {
  title: 'Web components/PfScrollArea',
  args: { focusable: true, orientation: 'vertical' },
  argTypes: {
    focusable: { control: 'boolean' },
    orientation: { control: 'select', options: ['both', 'horizontal', 'vertical'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-scroll-area"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
