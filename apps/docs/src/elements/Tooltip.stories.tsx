import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-tooltip'];

const meta = {
  title: 'Components/Tooltip',
  args: { delay: 120, disabled: false, placement: 'top' },
  argTypes: {
    delay: { control: 'number' },
    disabled: { control: 'boolean' },
    open: { control: 'boolean' },
    placement: { control: 'select', options: ['bottom', 'left', 'right', 'top'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-tooltip"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
