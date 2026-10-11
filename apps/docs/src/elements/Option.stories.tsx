import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-option'];

const meta = {
  title: 'Components/Option',
  args: { children: 'Banana', active: false, disabled: false, selected: false, value: 'banana' },
  argTypes: {
    children: { control: 'text' },
    active: { control: 'boolean' },
    disabled: { control: 'boolean' },
    selected: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-option"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
