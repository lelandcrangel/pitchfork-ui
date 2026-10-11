import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-slideout-menu'];

const meta = {
  title: 'Components/SlideoutMenu',
  args: {
    dismissable: true,
    open: false,
    placement: 'right',
    showCloseButton: true,
    size: 'md',
    label: 'Navigation',
    heading: 'Navigation',
  },
  argTypes: {
    description: { control: 'text' },
    dismissable: { control: 'boolean' },
    heading: { control: 'text' },
    label: { control: 'text' },
    open: { control: 'boolean' },
    placement: { control: 'select', options: ['left', 'right'] },
    showCloseButton: { control: 'boolean' },
    size: { control: 'select', options: ['lg', 'md', 'sm'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-slideout-menu"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
