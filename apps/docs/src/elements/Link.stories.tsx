import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-link'];

const meta = {
  title: 'Components/Link',
  args: { children: 'Setup guide', external: false, variant: 'default', href: '#guide' },
  argTypes: {
    children: { control: 'text' },
    download: { control: 'text' },
    external: { control: 'boolean' },
    href: { control: 'text' },
    rel: { control: 'text' },
    target: { control: 'text' },
    variant: { control: 'select', options: ['default', 'subtle'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-link"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
