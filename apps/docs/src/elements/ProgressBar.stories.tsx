import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-progress-bar'];

const meta = {
  title: 'Components/ProgressBar',
  args: { max: 100, showValue: true, value: 64, label: 'Upload' },
  argTypes: {
    label: { control: 'text' },
    max: { control: 'number' },
    showValue: { control: 'boolean' },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-progress-bar"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
