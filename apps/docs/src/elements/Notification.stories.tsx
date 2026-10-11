import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-notification'];

const meta = {
  title: 'Components/Notification',
  args: { dismissable: true, exiting: false, variant: 'success', heading: 'Saved' },
  argTypes: {
    description: { control: 'text' },
    dismissable: { control: 'boolean' },
    exiting: { control: 'boolean' },
    heading: { control: 'text' },
    variant: { control: 'select', options: ['danger', 'info', 'success', 'warning'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-notification"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
