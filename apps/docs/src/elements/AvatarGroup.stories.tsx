import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-avatar-group'];

const meta = {
  title: 'Components/AvatarGroup',
  args: { max: 3, size: 'md', label: 'Project reviewers' },
  argTypes: {
    label: { control: 'text' },
    max: { control: 'number' },
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xl'] },
    total: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-avatar-group"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
