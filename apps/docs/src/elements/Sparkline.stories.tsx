import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-sparkline'];

const meta = {
  title: 'Components/Sparkline',
  args: {
    animated: false,
    data: [4, 7, 5, 9, 8, 12, 10, 14, 11, 16, 15, 19, 17, 22],
    endDot: false,
    height: 36,
    strokeWidth: 1.5,
    variant: 'line',
    width: 120,
    label: 'Last fourteen days',
  },
  argTypes: {
    animated: { control: 'boolean' },
    color: { control: 'text' },
    data: { control: 'object' },
    endDot: { control: 'boolean' },
    height: { control: 'number' },
    label: { control: 'text' },
    strokeWidth: { control: 'number' },
    variant: { control: 'select', options: ['area', 'line'] },
    width: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-sparkline"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
