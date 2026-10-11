import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-radio-button'];

const meta = {
  title: 'Components/RadioButton',
  args: { checked: false, disabled: false, value: 'pro' },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-radio-button"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
