import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-progress-steps'];

const meta = {
  title: 'Components/ProgressSteps',
  args: { orientation: 'vertical' },
  argTypes: { orientation: { control: 'select', options: ['horizontal', 'vertical'] } },
  render: (args) => (
    <ElementPlayground
      tag="pf-progress-steps"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
