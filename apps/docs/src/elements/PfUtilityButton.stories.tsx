import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-utility-button'];

const meta = {
  title: 'Web components/PfUtilityButton',
  args: {
    disabled: false,
    size: 'md',
    type: 'button',
    variant: 'neutral',
    label: 'Copy',
    tooltip: 'Copy to clipboard',
  },
  argTypes: {
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    size: { control: 'select', options: ['md', 'sm'] },
    tooltip: { control: 'text' },
    type: { control: 'select', options: ['button', 'reset', 'submit'] },
    variant: { control: 'select', options: ['brand', 'destructive', 'neutral'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-utility-button"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
