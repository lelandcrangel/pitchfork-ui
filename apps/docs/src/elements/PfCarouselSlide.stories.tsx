import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-carousel-slide'];

const meta = {
  title: 'Web components/PfCarouselSlide',
  args: { active: false, position: 1, total: 1 },
  argTypes: {
    active: { control: 'boolean' },
    position: { control: 'number' },
    total: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-carousel-slide"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
