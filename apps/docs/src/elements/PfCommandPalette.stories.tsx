import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-command-palette'];

const meta = {
  title: 'Web components/PfCommandPalette',
  args: {
    dismissable: true,
    emptyMessage: 'No results found.',
    label: 'Command palette',
    open: true,
    placeholder: 'Search commands…',
  },
  argTypes: {
    dismissable: { control: 'boolean' },
    emptyMessage: { control: 'text' },
    label: { control: 'text' },
    open: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-command-palette"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
