import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-table-cell'];

const meta = {
  title: 'Web components/PfTableCell',
  args: {
    children: 'Item',
    align: 'left',
    head: true,
    last: false,
    sort: 'none',
    sortable: false,
    width: '160',
  },
  argTypes: {
    children: { control: 'text' },
    align: { control: 'select', options: ['center', 'left', 'right'] },
    head: { control: 'boolean' },
    last: { control: 'boolean' },
    sort: { control: 'select', options: ['ascending', 'descending', 'none'] },
    sortKey: { control: 'text' },
    sortable: { control: 'boolean' },
    width: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-table-cell"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
