import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-rating-stars'];

const meta = {
  title: 'Web components/PfRatingStars',
  args: { max: 5, showValue: true, size: 18, value: 4.5, label: 'Average rating' },
  argTypes: {
    label: { control: 'text' },
    max: { control: 'number' },
    showValue: { control: 'boolean' },
    size: { control: 'number' },
    value: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-rating-stars"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
