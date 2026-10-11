import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-section-footer'];

const meta = {
  title: 'Components/SectionFooter',
  args: { align: 'between', divider: true },
  argTypes: {
    align: { control: 'select', options: ['between', 'end', 'start'] },
    divider: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-section-footer"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
