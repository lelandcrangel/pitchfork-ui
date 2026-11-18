import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-checkbox-group'];

const meta = {
  title: 'Components/CheckboxGroup',
  args: {
    disabled: false,
    orientation: 'vertical',
    required: false,
    value: 'releases',
    name: 'topics',
    legend: 'Email me about',
    description: 'Pick any.',
  },
  argTypes: {
    description: { control: 'text' },
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    legend: { control: 'text' },
    name: { control: 'text' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    required: { control: 'boolean' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-checkbox-group"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
