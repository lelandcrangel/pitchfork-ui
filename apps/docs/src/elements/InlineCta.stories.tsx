import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-inline-cta'];

const meta = {
  title: 'Components/InlineCta',
  args: {
    dismissLabel: 'Dismiss',
    dismissible: true,
    exiting: false,
    icon: 'circle-info',
    tone: 'info',
  },
  argTypes: {
    dismissLabel: { control: 'text' },
    dismissible: { control: 'boolean' },
    exiting: { control: 'boolean' },
    icon: { control: 'text' },
    tone: { control: 'select', options: ['danger', 'default', 'info', 'success', 'warning'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-inline-cta"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
