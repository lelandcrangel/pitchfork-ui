import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-badge-group'];

const meta = {
  title: 'Components/BadgeGroup',
  args: {
    appearance: 'pill',
    badgePosition: 'leading',
    color: 'brand',
    label: 'New',
    message: 'Elements are here',
  },
  argTypes: {
    appearance: { control: 'select', options: ['modern', 'pill'] },
    badgePosition: { control: 'select', options: ['leading', 'trailing'] },
    color: { control: 'select', options: ['brand', 'error', 'gray', 'success', 'warning'] },
    label: { control: 'text' },
    message: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-badge-group"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
