import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-carousel'];

const meta = {
  title: 'Web components/PfCarousel',
  args: {
    autoPlay: false,
    autoPlayInterval: 5000,
    index: 0,
    label: 'Release highlights',
    loop: true,
    nextLabel: 'Next slide',
    previousLabel: 'Previous slide',
    showIndicators: true,
  },
  argTypes: {
    autoPlay: { control: 'boolean' },
    autoPlayInterval: { control: 'number' },
    index: { control: 'number' },
    label: { control: 'text' },
    loop: { control: 'boolean' },
    nextLabel: { control: 'text' },
    previousLabel: { control: 'text' },
    showIndicators: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-carousel"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
