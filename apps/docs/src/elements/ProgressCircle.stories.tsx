import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-progress-circle'];

const meta = {
  title: 'Components/ProgressCircle',
  args: { max: 100, showValue: true, size: 64, strokeWidth: 6, value: 42, label: 'Sync' },
  argTypes: {
    label: { control: 'text' },
    max: { control: 'number' },
    showValue: { control: 'boolean' },
    size: { control: 'number' },
    strokeWidth: { control: 'number' },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-progress-circle"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
