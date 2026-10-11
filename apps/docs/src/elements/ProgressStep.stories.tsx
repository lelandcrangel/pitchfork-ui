import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-progress-step'];

const meta = {
  title: 'Components/ProgressStep',
  args: { last: false, orientation: 'horizontal', position: 1, state: 'current' },
  argTypes: {
    last: { control: 'boolean' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    position: { control: 'number' },
    state: { control: 'select', options: ['complete', 'current', 'upcoming'] },
    status: { control: 'select', options: ['complete', 'current', 'upcoming'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-progress-step"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
