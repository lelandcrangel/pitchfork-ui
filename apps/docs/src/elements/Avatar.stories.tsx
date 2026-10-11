import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-avatar'];

const meta = {
  title: 'Components/Avatar',
  args: { size: 'md', name: 'Ada Lovelace' },
  argTypes: {
    alt: { control: 'text' },
    name: { control: 'text' },
    size: { control: 'select', options: ['lg', 'md', 'sm', 'xl'] },
    src: { control: 'text' },
    status: { control: 'select', options: ['away', 'busy', 'offline', 'online'] },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-avatar"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
