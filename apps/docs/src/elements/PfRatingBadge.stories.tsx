import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-rating-badge'];

const meta = {
  title: 'Web components/PfRatingBadge',
  args: { max: 5, size: 'md', value: 4.6, reviews: 1204 },
  argTypes: {
    max: { control: 'number' },
    reviews: { control: 'number' },
    size: { control: 'select', options: ['md', 'sm'] },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-rating-badge"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
