import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-nav-item'];

const meta = {
  title: 'Web components/PfNavItem',
  args: {
    children: 'Docs',
    current: true,
    currentPage: false,
    disabled: false,
    orientation: 'horizontal',
    href: '#',
  },
  argTypes: {
    children: { control: 'text' },
    current: { control: 'boolean' },
    currentPage: { control: 'boolean' },
    disabled: { control: 'boolean' },
    href: { control: 'text' },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    rel: { control: 'text' },
    target: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-nav-item"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
