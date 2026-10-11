import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-timeline-item'];

const meta = {
  title: 'Components/TimelineItem',
  args: { last: true, tone: 'success' },
  argTypes: {
    last: { control: 'boolean' },
    tone: { control: 'select', options: ['danger', 'default', 'success', 'warning'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-timeline-item"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
