import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-header-navigation'];

const meta = {
  title: 'Web components/PfHeaderNavigation',
  args: { label: 'Main' },
  argTypes: { label: { control: 'text' } },
  render: (args) => (
    <ElementPlayground
      tag="pf-header-navigation"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
