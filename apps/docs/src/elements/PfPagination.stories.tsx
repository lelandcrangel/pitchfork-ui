import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-pagination'];

const meta = {
  title: 'Web components/PfPagination',
  args: {
    boundaryCount: 1,
    disabled: false,
    label: 'Pagination',
    page: 4,
    showPrevNext: true,
    siblingCount: 1,
    totalPages: 12,
  },
  argTypes: {
    boundaryCount: { control: 'number' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    page: { control: 'number' },
    showPrevNext: { control: 'boolean' },
    siblingCount: { control: 'number' },
    totalPages: { control: 'number' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-pagination"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
