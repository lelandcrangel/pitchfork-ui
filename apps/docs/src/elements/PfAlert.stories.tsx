import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-alert'];

const meta = {
  title: 'Web components/PfAlert',
  args: {
    children: 'The API will be read-only on Sunday between 02:00 and 04:00 UTC.',
    dismissLabel: 'Dismiss alert',
    dismissible: false,
    variant: 'info',
    heading: 'Scheduled maintenance',
  },
  argTypes: {
    children: { control: 'text' },
    description: { control: 'text' },
    dismissLabel: { control: 'text' },
    dismissible: { control: 'boolean' },
    heading: { control: 'text' },
    variant: { control: 'select', options: ['danger', 'info', 'success', 'warning'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-alert"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
