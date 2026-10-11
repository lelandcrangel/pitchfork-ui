import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-table'];

const meta = {
  title: 'Components/Table',
  args: {
    dense: false,
    hoverable: true,
    sortDirection: 'asc',
    stickyHeader: false,
    striped: true,
    label: 'Orders',
    sortKey: 'name',
  },
  argTypes: {
    dense: { control: 'boolean' },
    hoverable: { control: 'boolean' },
    label: { control: 'text' },
    sortDirection: { control: 'select', options: ['asc', 'desc'] },
    sortKey: { control: 'text' },
    stickyHeader: { control: 'boolean' },
    striped: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-table"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
