import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-breadcrumbs'];

const meta = {
  title: 'Web components/PfBreadcrumbs',
  args: { label: 'You are here', separator: '›' },
  argTypes: { label: { control: 'text' }, separator: { control: 'text' } },
  render: (args) => (
    <ElementPlayground
      tag="pf-breadcrumbs"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
