import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-icon'];

const meta = {
  title: 'Components/Icon',
  args: { name: 'circle-check', label: 'Done' },
  argTypes: { label: { control: 'text' }, name: { control: 'text' } },
  render: (args) => (
    <ElementPlayground
      tag="pf-icon"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
