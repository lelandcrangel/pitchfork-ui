import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-resizable'];

const meta = {
  title: 'Components/Resizable',
  args: {
    handleLabel: 'Resize panels',
    max: 90,
    min: 10,
    orientation: 'horizontal',
    size: 40,
    step: 2,
  },
  argTypes: {
    handleLabel: { control: 'text' },
    max: { control: 'number' },
    min: { control: 'number' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    size: { control: 'number' },
    step: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-resizable"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
