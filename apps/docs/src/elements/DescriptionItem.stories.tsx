import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-description-item'];

const meta = {
  title: 'Components/DescriptionItem',
  args: {
    children: 'Team, billed yearly',
    divided: false,
    orientation: 'horizontal',
    term: 'Plan',
  },
  argTypes: {
    children: { control: 'text' },
    divided: { control: 'boolean' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    term: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-description-item"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
