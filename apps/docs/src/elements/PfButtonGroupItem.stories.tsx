import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-button-group-item'];

const meta = {
  title: 'Web components/PfButtonGroupItem',
  args: {
    children: 'Week',
    disabled: false,
    dot: false,
    groupDisabled: false,
    selected: false,
    value: 'week',
  },
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    dot: { control: 'boolean' },
    groupDisabled: { control: 'boolean' },
    icon: { control: 'text' },
    selected: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-button-group-item"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
