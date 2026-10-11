import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-tab'];

const meta = {
  title: 'Components/Tab',
  args: {
    children: 'Overview',
    badgePlacement: 'end',
    disabled: false,
    fullWidth: false,
    iconPlacement: 'start',
    selected: false,
    size: 'md',
    value: 'overview',
    variant: 'underline',
  },
  argTypes: {
    children: { control: 'text' },
    badgePlacement: { control: 'select', options: ['end', 'start'] },
    count: { control: 'number' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    icon: { control: 'text' },
    iconPlacement: { control: 'select', options: ['end', 'start'] },
    selected: { control: 'boolean' },
    size: { control: 'select', options: ['md', 'sm'] },
    value: { control: 'text' },
    variant: { control: 'select', options: ['pills', 'underline'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-tab"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
